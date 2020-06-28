'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const Sharp = require('sharp');
const zlib = require('zlib');

// parameters
const { URL } = process.env;
const WHITELIST = process.env.WHITELIST
  ? Object.freeze(process.env.WHITELIST.split(' '))
  : null;

const resizer = async (event) => {
  // const queryParameters = event.queryStringParameters || {};
  const bucket = decodeURIComponent(event.pathParameters.bucket);
  const imageKey = decodeURIComponent(event.pathParameters.key);
  const resizeOption = decodeURIComponent(event.pathParameters.size); // e.g. "150x150_max"

  const sizeAndAction = resizeOption.split('_');

  const sizes = sizeAndAction[0].split('x');
  const action = sizeAndAction.length > 1 ? sizeAndAction[1] : null;

  // Whitelist validation.
  if (WHITELIST && !WHITELIST.includes(resizeOption)) {
    return {
      statusCode: 400,
      body: `WHITELIST is set but does not contain the size parameter "${resizeOption}"`,
      headers: { 'Content-Type': 'text/plain' },
    };
  }

  // Action validation.
  if (action && action !== 'max' && action !== 'min') {
    return {
      statusCode: 400,
      body:
        `Unknown func parameter "${action}"\n` +
        'For query ".../150x150_func", "_func" must be either empty, "_min" or "_max"',
      headers: { 'Content-Type': 'text/plain' },
    };
  }

  try {
    const data = await S3.getObject({
      Bucket: bucket,
      Key: imageKey,
    }).promise();

    const width = sizes[0] === 'AUTO' ? null : parseInt(sizes[0]);
    const height = sizes[1] === 'AUTO' ? null : parseInt(sizes[1]);
    let fit;
    switch (action) {
      case 'max':
        fit = 'inside';
        break;
      case 'min':
        fit = 'outside';
        break;
      default:
        fit = 'cover';
        break;
    }
    const result = await Sharp(data.Body, { failOnError: false })
      .resize(width, height, { withoutEnlargement: true, fit })
      .rotate()
      .toBuffer();

    const newKey = resizeOption + '/' + imageKey;
    await S3.putObject({
      Body: zlib.gzipSync(result),
      Bucket: bucket,
      ContentType: 'image/jpeg',
      Key: newKey,
      CacheControl: 'public, max-age=31536000',
      ACL: 'public-read',
      ContentEncoding: 'gzip',
    }).promise();

    /**
     * Return base64-encoded to avoid any circular loops.
     */

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
      body: result.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (e) {
    return {
      statusCode: e.statusCode || 400,
      body: 'Exception: ' + e.message,
      headers: { 'Content-Type': 'text/plain' },
    };
  }
};

module.exports = {
  resizer,
};
