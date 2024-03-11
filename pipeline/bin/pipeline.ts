#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline-stack";
import * as fs from "fs";

const configPath = "./config.json";

interface Config {
  repository: string;
  environments: {
    [key: string]: EnvironmentConfig;
  };
}

interface EnvironmentConfig {
  account?: string;
  region?: string;
  branch: string;
}

const validateConfig = (config: Config): boolean => {
  if (!config.repository) {
    console.error("The 'repository' field is missing in config.json.");
    return false;
  }

  for (const [envName, envConfig] of Object.entries(config.environments)) {
    if (!envConfig.branch) {
      console.error(
        `The 'branch' field is missing in the '${envName}' environment configuration.`
      );
      return false;
    }
  }

  return true;
};

if (fs.existsSync(configPath)) {
  const configData = fs.readFileSync(configPath, "utf8");
  try {
    const config: Config = JSON.parse(configData);

    if (!validateConfig(config)) {
      process.exit(1);
    }

    const app = new cdk.App();

    // Create a pipeline for each environment
    Object.entries(config.environments).forEach(
      ([environmentName, environmentConfig]) => {
        new PipelineStack(app, `${environmentName}PipelineStack`, {
          repoName: config.repository,
          env: {
            account: environmentConfig.account,
            region: environmentConfig.region,
          },
          branch: environmentConfig.branch,
          environmentName: environmentName,
        });
      }
    );

    app.synth();
  } catch (error) {
    console.error("Error parsing config.json:", error);
    process.exit(1);
  }
} else {
  console.error("Configuration file config.json not found.");
  process.exit(1);
}
