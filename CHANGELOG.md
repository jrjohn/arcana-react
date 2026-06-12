# Changelog

## [1.0.2](https://github.com/jrjohn/arcana-react/compare/v1.0.1...v1.0.2) (2026-06-12)


### Bug Fixes

* [@use](https://github.com/use) rules must precede [@import](https://github.com/import) (Sass ordering) ([6eedf4c](https://github.com/jrjohn/arcana-react/commit/6eedf4c957b62a49a877e23444a327ba265da21f))
* **arch-qube:** move UserServiceImpl class to impl/ directory ([3ad0305](https://github.com/jrjohn/arcana-react/commit/3ad03056f526b4078981b06efcb99e10d9b87434))
* **arch-qube:** move userServiceImpl.ts into impl/ subdir (interface-impl-colocation) ([a2a1e7e](https://github.com/jrjohn/arcana-react/commit/a2a1e7e3382e578dd9ac780ccb2e8ad0f2b5707d))
* **ci:** parse Sonar quality-gate JSON without jq ([2708cf6](https://github.com/jrjohn/arcana-react/commit/2708cf6893c177f3aa17d232747ebdc1c0dc2ed8))
* **ci:** rmi stale static :1.0.0 tag before compose build ([c5dee3c](https://github.com/jrjohn/arcana-react/commit/c5dee3cd9923354f401b5a892f20a11c8118616f))
* complete sonar-project.properties with sources/tests/exclusions ([b446abc](https://github.com/jrjohn/arcana-react/commit/b446abcf30bc51aa8cc363717fffbe5ab34f80a4))
* eliminate Sass deprecation warnings + suppress test stderr ([33b0a87](https://github.com/jrjohn/arcana-react/commit/33b0a87a9231b52a4dba880098d28253951ce4b7))
* enable coverage.all in CI and fix S7764 window→globalThis in tests ([12184cb](https://github.com/jrjohn/arcana-react/commit/12184cbf30f598ed4f1877a99321757d5df72093))
* enable coverage.all to track all source files in lcov report ([f427579](https://github.com/jrjohn/arcana-react/commit/f427579a83982b788a1de4b7dc1717a7e7d67ca4))
* let vitest.config.ts control coverage settings (not CLI flags) ([f813397](https://github.com/jrjohn/arcana-react/commit/f813397538ea7cdd6095972f296605dd856597a4))
* remove rightPanelOpen prop from Header test (prop was removed) ([e0fc57a](https://github.com/jrjohn/arcana-react/commit/e0fc57a282417bc7c01fa48a892dcdbdeb102939))
* remove unused Language type import ([fbe50b1](https://github.com/jrjohn/arcana-react/commit/fbe50b14746837c83485f57cb4fc926a66041bcb))
* resolve all 84 SonarQube code smells ([2014413](https://github.com/jrjohn/arcana-react/commit/2014413d7cdf9b6290c4bd2a13f2c7a6e8d12d3e))
* resolve SonarQube bugs and code smells ([470db18](https://github.com/jrjohn/arcana-react/commit/470db18a9b45db8d6a7e17d6503d137ac72c0d14))
* restore UserServiceImpl content (was broken re-export) ([4e0102e](https://github.com/jrjohn/arcana-react/commit/4e0102e906c071bb6a1c6c1c5d833f204de57f92))
* revert to v8 coverage provider, add coverage/ to gitignore ([280a997](https://github.com/jrjohn/arcana-react/commit/280a997432c91a263b1469e25398e0779bceca1b))
* **sonar:** add lcov path + interface exclusions + tests for DIProvider/serviceConfig/constants ([2e08746](https://github.com/jrjohn/arcana-react/commit/2e087469554dadf11426efe90feff2d847254dee))
* **sonar:** exclude test files from coverage measurement ([ef78f8c](https://github.com/jrjohn/arcana-react/commit/ef78f8cf478ba68675bd56548f27c92c84ca2ab2))
* **sonar:** remove TODO comment (S1135) ([c4ef4c6](https://github.com/jrjohn/arcana-react/commit/c4ef4c6ab1c1e8ab4bc9fb1a2aca05f23189ac7e))
* **sonar:** resolve 6 SonarQube violations across source files ([666abdd](https://github.com/jrjohn/arcana-react/commit/666abdd1478c81b1638fcb416853bdb9262629da))
* update stale coverage exclusion path after userServiceImpl moved to impl/ ([f6c8ec2](https://github.com/jrjohn/arcana-react/commit/f6c8ec2f30c39572ff817a362b040f86aadf0ba2))

## [1.0.1](https://github.com/jrjohn/arcana-react/compare/arcana-react-v1.0.0...arcana-react-v1.0.1) (2026-06-11)


### Bug Fixes

* [@use](https://github.com/use) rules must precede [@import](https://github.com/import) (Sass ordering) ([6eedf4c](https://github.com/jrjohn/arcana-react/commit/6eedf4c957b62a49a877e23444a327ba265da21f))
* **arch-qube:** move UserServiceImpl class to impl/ directory ([3ad0305](https://github.com/jrjohn/arcana-react/commit/3ad03056f526b4078981b06efcb99e10d9b87434))
* **arch-qube:** move userServiceImpl.ts into impl/ subdir (interface-impl-colocation) ([a2a1e7e](https://github.com/jrjohn/arcana-react/commit/a2a1e7e3382e578dd9ac780ccb2e8ad0f2b5707d))
* **ci:** parse Sonar quality-gate JSON without jq ([2708cf6](https://github.com/jrjohn/arcana-react/commit/2708cf6893c177f3aa17d232747ebdc1c0dc2ed8))
* **ci:** rmi stale static :1.0.0 tag before compose build ([c5dee3c](https://github.com/jrjohn/arcana-react/commit/c5dee3cd9923354f401b5a892f20a11c8118616f))
* complete sonar-project.properties with sources/tests/exclusions ([b446abc](https://github.com/jrjohn/arcana-react/commit/b446abcf30bc51aa8cc363717fffbe5ab34f80a4))
* eliminate Sass deprecation warnings + suppress test stderr ([33b0a87](https://github.com/jrjohn/arcana-react/commit/33b0a87a9231b52a4dba880098d28253951ce4b7))
* enable coverage.all in CI and fix S7764 window→globalThis in tests ([12184cb](https://github.com/jrjohn/arcana-react/commit/12184cbf30f598ed4f1877a99321757d5df72093))
* enable coverage.all to track all source files in lcov report ([f427579](https://github.com/jrjohn/arcana-react/commit/f427579a83982b788a1de4b7dc1717a7e7d67ca4))
* let vitest.config.ts control coverage settings (not CLI flags) ([f813397](https://github.com/jrjohn/arcana-react/commit/f813397538ea7cdd6095972f296605dd856597a4))
* remove rightPanelOpen prop from Header test (prop was removed) ([e0fc57a](https://github.com/jrjohn/arcana-react/commit/e0fc57a282417bc7c01fa48a892dcdbdeb102939))
* remove unused Language type import ([fbe50b1](https://github.com/jrjohn/arcana-react/commit/fbe50b14746837c83485f57cb4fc926a66041bcb))
* resolve all 84 SonarQube code smells ([2014413](https://github.com/jrjohn/arcana-react/commit/2014413d7cdf9b6290c4bd2a13f2c7a6e8d12d3e))
* resolve SonarQube bugs and code smells ([470db18](https://github.com/jrjohn/arcana-react/commit/470db18a9b45db8d6a7e17d6503d137ac72c0d14))
* restore UserServiceImpl content (was broken re-export) ([4e0102e](https://github.com/jrjohn/arcana-react/commit/4e0102e906c071bb6a1c6c1c5d833f204de57f92))
* revert to v8 coverage provider, add coverage/ to gitignore ([280a997](https://github.com/jrjohn/arcana-react/commit/280a997432c91a263b1469e25398e0779bceca1b))
* **sonar:** add lcov path + interface exclusions + tests for DIProvider/serviceConfig/constants ([2e08746](https://github.com/jrjohn/arcana-react/commit/2e087469554dadf11426efe90feff2d847254dee))
* **sonar:** exclude test files from coverage measurement ([ef78f8c](https://github.com/jrjohn/arcana-react/commit/ef78f8cf478ba68675bd56548f27c92c84ca2ab2))
* **sonar:** remove TODO comment (S1135) ([c4ef4c6](https://github.com/jrjohn/arcana-react/commit/c4ef4c6ab1c1e8ab4bc9fb1a2aca05f23189ac7e))
* **sonar:** resolve 6 SonarQube violations across source files ([666abdd](https://github.com/jrjohn/arcana-react/commit/666abdd1478c81b1638fcb416853bdb9262629da))
* update stale coverage exclusion path after userServiceImpl moved to impl/ ([f6c8ec2](https://github.com/jrjohn/arcana-react/commit/f6c8ec2f30c39572ff817a362b040f86aadf0ba2))
