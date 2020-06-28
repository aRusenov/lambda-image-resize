- For each whitelisted S3 bucket in env.yml go to:
 AWS Console > S3 > find bucket > Properties > Static Website Hosting > Redirection Rules
 ```xml
<RoutingRules>
  <RoutingRule>
    <Condition>
      <KeyPrefixEquals/>
      <HttpErrorCodeReturnedEquals>404</HttpErrorCodeReturnedEquals>
    </Condition>
    <Redirect>
      <Protocol>https</Protocol>
      <HostName>{{api gateway base url}}</HostName>
      <ReplaceKeyPrefixWith>{{stage}}/{{bucket}}/</ReplaceKeyPrefixWith>
      <HttpRedirectCode>307</HttpRedirectCode>
    </Redirect>
  </RoutingRule>
</RoutingRules>
``` 

- Go to API Gateway and under Settings > Binary Media Types add `*/*` and redeploy the API.

    Why: See https://stackoverflow.com/a/47780921/7116844.
