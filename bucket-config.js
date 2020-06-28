/**
 * Formats the IAM resource array for Serverless to register
 * as part of the lambda S3 access policy.
 * @param serverless
 * @returns {Promise<*>}
 */
module.exports = async (serverless) => {
  const stage = serverless.pluginManager.cliOptions.stage;
  const envConfig = await serverless.yamlParser.parse('env.yml');
  const buckets = envConfig[stage].BUCKETS;

  const iamResourceArray = buckets.map((b) => `arn:aws:s3:::${b}/*`);
  return iamResourceArray;
};
