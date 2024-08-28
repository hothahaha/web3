//! Test helpers for Forge integration tests.

use alloy_primitives::U256;
use forge::{
    revm::primitives::SpecId, MultiContractRunner, MultiContractRunnerBuilder, TestOptions,
    TestOptionsBuilder,
};
use foundry_compilers::{
    artifacts::{EvmVersion, Libraries, Settings},
    multi::MultiCompilerLanguage,
    solc::SolcCompiler,
    zksync::{
        cache::ZKSYNC_SOLIDITY_FILES_CACHE_FILENAME,
        compile::output::ProjectCompileOutput as ZkProjectCompileOutput,
    },
    Project, ProjectCompileOutput, ProjectPathsConfig, SolcConfig,
};
use foundry_config::{
    fs_permissions::PathPermission, Config, FsPermissions, FuzzConfig, FuzzDictionaryConfig,
    InvariantConfig, RpcEndpoint, RpcEndpoints,
};
use foundry_evm::{
    constants::CALLER,
    opts::{Env, EvmOpts},
};
use foundry_test_utils::{fd_lock, init_tracing};
use foundry_zksync_compiler::DualCompiledContracts;
use once_cell::sync::Lazy;
use semver::Version;
use std::{
    env, fmt,
    io::Write,
    path::{Path, PathBuf},
    sync::Arc,
};

type ZkProject = Project<SolcCompiler>;

pub const RE_PATH_SEPARATOR: &str = "/";
const TESTDATA: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../testdata");

/// Profile for the tests group. Used to configure separate configurations for test runs.
pub enum ForgeTestProfile {
    Default,
    Cancun,
    MultiVersion,
}

impl fmt::Display for ForgeTestProfile {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Default => write!(f, "default"),
            Self::Cancun => write!(f, "cancun"),
            Self::MultiVersion => write!(f, "multi-version"),
        }
    }
}

impl ForgeTestProfile {
    /// Returns true if the profile is Cancun.
    pub fn is_cancun(&self) -> bool {
        matches!(self, Self::Cancun)
    }

    pub fn root(&self) -> PathBuf {
        PathBuf::from(TESTDATA)
    }

    /// Configures the solc settings for the test profile.
    pub fn solc_config(&self) -> SolcConfig {
        let libs =
            ["fork/Fork.t.sol:DssExecLib:0xfD88CeE74f7D78697775aBDAE53f9Da1559728E4".to_string()];

        let mut settings =
            Settings { libraries: Libraries::parse(&libs).unwrap(), ..Default::default() };

        if matches!(self, Self::Cancun) {
            settings.evm_version = Some(EvmVersion::Cancun);
        }

        SolcConfig::builder().settings(settings).build()
    }

    pub fn project(&self) -> Project {
        self.config().project().expect("Failed to build project")
    }

    pub fn zk_project(&self) -> ZkProject {
        let zk_config = self.zk_config();
        let mut zk_project =
            foundry_zksync_compiler::create_project(&zk_config, zk_config.cache, false)
                .expect("failed creating zksync project");
        zk_project.paths.zksync_artifacts = zk_config.root.as_ref().join("zk").join("zkout");
        zk_project.paths.zksync_cache = zk_config
            .root
            .as_ref()
            .join("zk")
            .join("cache")
            .join(ZKSYNC_SOLIDITY_FILES_CACHE_FILENAME);

        zk_project
    }

    pub fn test_opts(&self, output: &ProjectCompileOutput) -> TestOptions {
        TestOptionsBuilder::default()
            .fuzz(FuzzConfig {
                runs: 256,
                max_test_rejects: 65536,
                seed: None,
                dictionary: FuzzDictionaryConfig {
                    include_storage: true,
                    include_push_bytes: true,
                    dictionary_weight: 40,
                    max_fuzz_dictionary_addresses: 10_000,
                    max_fuzz_dictionary_values: 10_000,
                },
                gas_report_samples: 256,
                failure_persist_dir: Some(tempfile::tempdir().unwrap().into_path()),
                failure_persist_file: Some("testfailure".to_string()),
                no_zksync_reserved_addresses: false,
            })
            .invariant(InvariantConfig {
                runs: 256,
                depth: 15,
                fail_on_revert: false,
                call_override: false,
                dictionary: FuzzDictionaryConfig {
                    dictionary_weight: 80,
                    include_storage: true,
                    include_push_bytes: true,
                    max_fuzz_dictionary_addresses: 10_000,
                    max_fuzz_dictionary_values: 10_000,
                },
                shrink_run_limit: 5000,
                max_assume_rejects: 65536,
                gas_report_samples: 256,
                failure_persist_dir: Some(tempfile::tempdir().unwrap().into_path()),
                no_zksync_reserved_addresses: false,
            })
            .build(output, Path::new(self.project().root()))
            .expect("Config loaded")
    }

    pub fn evm_opts(&self) -> EvmOpts {
        EvmOpts {
            env: Env {
                gas_limit: u64::MAX,
                chain_id: None,
                tx_origin: CALLER,
                block_number: 1,
                block_timestamp: 1,
                ..Default::default()
            },
            sender: CALLER,
            initial_balance: U256::MAX,
            ffi: true,
            verbosity: 3,
            memory_limit: 1 << 26,
            ..Default::default()
        }
    }

    /// Build [Config] for test profile.
    ///
    /// Project source files are read from testdata/{profile_name}
    /// Project output files are written to testdata/out/{profile_name}
    /// Cache is written to testdata/cache/{profile_name}
    ///
    /// AST output is enabled by default to support inline configs.
    pub fn config(&self) -> Config {
        let mut config = Config::with_root(self.root());

        config.ast = true;
        config.src = self.root().join(self.to_string());
        config.out = self.root().join("out").join(self.to_string());
        config.cache_path = self.root().join("cache").join(self.to_string());
        config.libraries = vec![
            "fork/Fork.t.sol:DssExecLib:0xfD88CeE74f7D78697775aBDAE53f9Da1559728E4".to_string(),
        ];

        if self.is_cancun() {
            config.evm_version = EvmVersion::Cancun;
        }

        config
    }

    /// Build [Config] for zksync test profile.
    ///
    /// Project source files are read from testdata/zk
    /// Project output files are written to testdata/zk/out and testdata/zk/zkout
    /// Cache is written to testdata/zk/cache
    ///
    /// AST output is enabled by default to support inline configs.
    pub fn zk_config(&self) -> Config {
        let mut zk_config = Config::with_root(self.root());

        zk_config.ast = true;
        zk_config.src = self.root().join("./zk");
        zk_config.test = self.root().join("./zk");
        zk_config.out = self.root().join("zk").join("out");
        zk_config.cache_path = self.root().join("zk").join("cache");
        zk_config.evm_version = EvmVersion::London;

        zk_config.zksync.startup = true;
        zk_config.zksync.fallback_oz = true;
        zk_config.zksync.optimizer_mode = '3';
        zk_config.zksync.zksolc = Some(foundry_config::SolcReq::Version(Version::new(1, 5, 1)));
        zk_config.fuzz.no_zksync_reserved_addresses = true;

        zk_config
    }
}

/// Container for test data for zkSync specific tests.
pub struct ZkTestData {
    pub dual_compiled_contracts: DualCompiledContracts,
    pub zk_config: Config,
    pub zk_project: ZkProject,
    pub output: ProjectCompileOutput,
    pub zk_output: ZkProjectCompileOutput,
}

/// Container for test data for a specific test profile.
pub struct ForgeTestData {
    pub project: Project,
    pub output: ProjectCompileOutput,
    pub test_opts: TestOptions,
    pub evm_opts: EvmOpts,
    pub config: Config,
    pub profile: ForgeTestProfile,
    pub zk_test_data: ZkTestData,
}

impl ForgeTestData {
    /// Builds [ForgeTestData] for the given [ForgeTestProfile].
    ///
    /// Uses [get_compiled] to lazily compile the project.
    pub fn new(profile: ForgeTestProfile) -> Self {
        let project = profile.project();
        let output = get_compiled(&project);
        let test_opts = profile.test_opts(&output);
        let config = profile.config();
        let evm_opts = profile.evm_opts();

        let zk_test_data = {
            let zk_config = profile.zk_config();
            let zk_project = profile.zk_project();

            let project = zk_config.project().expect("failed obtaining project");
            let output = get_compiled(&project);
            let zk_output = get_zk_compiled(&zk_project);
            let layout = ProjectPathsConfig {
                root: zk_project.paths.root.clone(),
                cache: zk_project.paths.cache.clone(),
                artifacts: zk_project.paths.artifacts.clone(),
                build_infos: zk_project.paths.build_infos.clone(),
                sources: zk_project.paths.sources.clone(),
                tests: zk_project.paths.tests.clone(),
                scripts: zk_project.paths.scripts.clone(),
                libraries: zk_project.paths.libraries.clone(),
                remappings: zk_project.paths.remappings.clone(),
                include_paths: zk_project.paths.include_paths.clone(),
                allowed_paths: zk_project.paths.allowed_paths.clone(),
                zksync_artifacts: zk_project.paths.zksync_artifacts.clone(),
                zksync_cache: zk_project.paths.zksync_cache.clone(),
                _l: std::marker::PhantomData::<MultiCompilerLanguage>,
            };
            let dual_compiled_contracts = DualCompiledContracts::new(&output, &zk_output, &layout);
            ZkTestData { dual_compiled_contracts, zk_config, zk_project, output, zk_output }
        };

        Self { project, output, test_opts, evm_opts, config, profile, zk_test_data }
    }

    /// Builds a base runner
    pub fn base_runner(&self) -> MultiContractRunnerBuilder {
        init_tracing();
        let mut runner = MultiContractRunnerBuilder::new(Arc::new(self.config.clone()))
            .sender(self.evm_opts.sender)
            .with_test_options(self.test_opts.clone());
        if self.profile.is_cancun() {
            runner = runner.evm_spec(SpecId::CANCUN);
        }

        runner
    }

    /// Builds a non-tracing runner
    pub fn runner(&self) -> MultiContractRunner {
        let mut config = self.config.clone();
        config.fs_permissions =
            FsPermissions::new(vec![PathPermission::read_write(manifest_root())]);
        self.runner_with_config(config)
    }

    /// Builds a non-tracing zksync runner
    /// TODO: This needs to be implemented as currently it is a copy of the original function
    pub fn runner_zksync(&self) -> MultiContractRunner {
        let mut zk_config = self.zk_test_data.zk_config.clone();
        zk_config.fs_permissions =
            FsPermissions::new(vec![PathPermission::read_write(manifest_root())]);
        self.runner_with_zksync_config(zk_config)
    }

    /// Builds a non-tracing runner
    pub fn runner_with_config(&self, mut config: Config) -> MultiContractRunner {
        config.rpc_endpoints = rpc_endpoints();
        config.allow_paths.push(manifest_root().to_path_buf());

        // no prompt testing
        config.prompt_timeout = 0;

        let root = self.project.root();
        let mut opts = self.evm_opts.clone();

        if config.isolate {
            opts.isolate = true;
        }

        let env = opts.local_evm_env();
        let output = self.output.clone();

        let sender = config.sender;

        let mut builder = self.base_runner();
        builder.config = Arc::new(config);
        builder
            .enable_isolation(opts.isolate)
            .sender(sender)
            .with_test_options(self.test_opts.clone())
            .build(root, output, None, env, opts.clone(), Default::default())
            .unwrap()
    }

    /// Builds a non-tracing runner with zksync
    /// TODO: This needs to be added as currently it is a copy of the original function
    pub fn runner_with_zksync_config(&self, mut zk_config: Config) -> MultiContractRunner {
        zk_config.rpc_endpoints = rpc_endpoints_zk();
        zk_config.allow_paths.push(manifest_root().to_path_buf());

        // no prompt testing
        zk_config.prompt_timeout = 0;

        let root = self.zk_test_data.zk_project.root();
        let mut opts = self.evm_opts.clone();

        if zk_config.isolate {
            opts.isolate = true;
        }

        let env = opts.local_evm_env();
        let output = self.zk_test_data.output.clone();
        let zk_output = self.zk_test_data.zk_output.clone();
        let dual_compiled_contracts = self.zk_test_data.dual_compiled_contracts.clone();
        let mut test_opts = self.test_opts.clone();
        test_opts.fuzz.no_zksync_reserved_addresses = zk_config.fuzz.no_zksync_reserved_addresses;
        let sender = zk_config.sender;

        let mut builder = self.base_runner();
        builder.config = Arc::new(zk_config);
        builder
            .enable_isolation(opts.isolate)
            .sender(sender)
            .with_test_options(test_opts)
            .build(root, output, Some(zk_output), env, opts.clone(), dual_compiled_contracts)
            .unwrap()
    }

    /// Builds a tracing runner
    pub fn tracing_runner(&self) -> MultiContractRunner {
        let mut opts = self.evm_opts.clone();
        opts.verbosity = 5;
        self.base_runner()
            .build(
                self.project.root(),
                self.output.clone(),
                None,
                opts.local_evm_env(),
                opts,
                Default::default(),
            )
            .unwrap()
    }

    /// Builds a runner that runs against forked state
    pub async fn forked_runner(&self, rpc: &str) -> MultiContractRunner {
        let mut opts = self.evm_opts.clone();

        opts.env.chain_id = None; // clear chain id so the correct one gets fetched from the RPC
        opts.fork_url = Some(rpc.to_string());

        let env = opts.evm_env().await.expect("Could not instantiate fork environment");
        let fork = opts.get_fork(&Default::default(), env.clone());

        self.base_runner()
            .with_fork(fork)
            .build(self.project.root(), self.output.clone(), None, env, opts, Default::default())
            .unwrap()
    }
}

pub fn get_compiled(project: &Project) -> ProjectCompileOutput {
    let lock_file_path = project.sources_path().join(".lock");
    // Compile only once per test run.
    // We need to use a file lock because `cargo-nextest` runs tests in different processes.
    // This is similar to [`foundry_test_utils::util::initialize`], see its comments for more
    // details.
    let mut lock = fd_lock::new_lock(&lock_file_path);
    let read = lock.read().unwrap();
    let out;
    if project.cache_path().exists() && std::fs::read(&lock_file_path).unwrap() == b"1" {
        out = project.compile();
        drop(read);
    } else {
        drop(read);
        let mut write = lock.write().unwrap();
        write.write_all(b"1").unwrap();
        out = project.compile();
        drop(write);
    }

    let out = out.unwrap();
    if out.has_compiler_errors() {
        panic!("Compiled with errors:\n{out}");
    }
    out
}

pub fn get_zk_compiled(zk_project: &ZkProject) -> ZkProjectCompileOutput {
    let lock_file_path = zk_project.sources_path().join(".lock-zk");
    // Compile only once per test run.
    // We need to use a file lock because `cargo-nextest` runs tests in different processes.
    // This is similar to [`foundry_test_utils::util::initialize`], see its comments for more
    // details.
    let mut lock = fd_lock::new_lock(&lock_file_path);
    let read = lock.read().unwrap();
    let out;

    let zk_compiler = foundry_common::compile::ProjectCompiler::new();
    if zk_project.paths.zksync_cache.exists() && std::fs::read(&lock_file_path).unwrap() == b"1" {
        out = zk_compiler.zksync_compile(zk_project, None);
        drop(read);
    } else {
        drop(read);
        let mut write = lock.write().unwrap();
        write.write_all(b"1").unwrap();
        out = zk_compiler.zksync_compile(zk_project, None);
        drop(write);
    }

    let out = out.expect("failed compiling zksync project");
    if out.has_compiler_errors() {
        panic!("Compiled with errors:\n{out}");
    }
    out
}

pub static EVM_OPTS: Lazy<EvmOpts> = Lazy::new(|| EvmOpts {
    env: Env {
        gas_limit: u64::MAX,
        chain_id: None,
        tx_origin: Config::DEFAULT_SENDER,
        block_number: 1,
        block_timestamp: 1,
        ..Default::default()
    },
    sender: Config::DEFAULT_SENDER,
    initial_balance: U256::MAX,
    ffi: true,
    verbosity: 3,
    memory_limit: 1 << 26,
    ..Default::default()
});

/// Default data for the tests group.
pub static TEST_DATA_DEFAULT: Lazy<ForgeTestData> =
    Lazy::new(|| ForgeTestData::new(ForgeTestProfile::Default));

/// Data for tests requiring Cancun support on Solc and EVM level.
pub static TEST_DATA_CANCUN: Lazy<ForgeTestData> =
    Lazy::new(|| ForgeTestData::new(ForgeTestProfile::Cancun));

/// Data for tests requiring Cancun support on Solc and EVM level.
pub static TEST_DATA_MULTI_VERSION: Lazy<ForgeTestData> =
    Lazy::new(|| ForgeTestData::new(ForgeTestProfile::MultiVersion));

pub fn manifest_root() -> &'static Path {
    let mut root = Path::new(env!("CARGO_MANIFEST_DIR"));
    // need to check here where we're executing the test from, if in `forge` we need to also allow
    // `testdata`
    if root.ends_with("forge") {
        root = root.parent().unwrap();
    }
    root
}

/// the RPC endpoints used during tests
pub fn rpc_endpoints() -> RpcEndpoints {
    RpcEndpoints::new([
        (
            "rpcAlias",
            RpcEndpoint::Url(
                "https://eth-mainnet.alchemyapi.io/v2/Lc7oIGYeL_QvInzI0Wiu_pOZZDEKBrdf".to_string(),
            ),
        ),
        (
            "rpcAliasSepolia",
            RpcEndpoint::Url(
                "https://eth-sepolia.g.alchemy.com/v2/Lc7oIGYeL_QvInzI0Wiu_pOZZDEKBrdf".to_string(),
            ),
        ),
        ("rpcEnvAlias", RpcEndpoint::Env("${RPC_ENV_ALIAS}".to_string())),
    ])
}

/// the RPC endpoints used during tests
pub fn rpc_endpoints_zk() -> RpcEndpoints {
    // use mainnet url from env to avoid rate limiting in CI
    let mainnet_url =
        std::env::var("TEST_MAINNET_URL").unwrap_or("https://mainnet.era.zksync.io".to_string()); // trufflehog:ignore
    RpcEndpoints::new([
        ("mainnet", RpcEndpoint::Url(mainnet_url)),
        (
            "rpcAlias",
            RpcEndpoint::Url(
                "https://eth-mainnet.alchemyapi.io/v2/Lc7oIGYeL_QvInzI0Wiu_pOZZDEKBrdf".to_string(), /* trufflehog:ignore */
            ),
        ),
        (
            "rpcAliasSepolia",
            RpcEndpoint::Url(
                "https://eth-sepolia.g.alchemy.com/v2/Lc7oIGYeL_QvInzI0Wiu_pOZZDEKBrdf".to_string(), /* trufflehog:ignore */
            ),
        ),
        ("rpcEnvAlias", RpcEndpoint::Env("${RPC_ENV_ALIAS}".to_string())),
    ])
}