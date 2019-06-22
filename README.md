# curl-queue

## Create Job
`curl -d "{\"url\":\"www.google.com\"}" -H "Content-Type: application/json" -X POST http://localhost:3000/api/sites`

## Check Job Status
`curl http://localhost:3000/api/sites/1`
