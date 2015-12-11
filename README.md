# RedisIndex.js

RedisIndex is a [Redis](http://redis.io) based minimal search indexer.

##API
Check test.js for more examples.

### Initialize
RedisIndex is built on top of [node_redis](https://github.com/NodeRedis/node_redis). 
It's initialized with a redis client object.

```javascript
var redisClient = require('redis').createClient();
var indexer = new RedisIndex({ 
  redisClient: redisClient,   // required
  keyPrefix: 'my-namespace:'  // optional, default = 'ri:'
});
```

### Add to index
Use `index` to add a document. If the document ID exists, the document will be 
removed and re-added with the new content. The content will be uncapitalized 
and tokenized on white spaces and punctuations. Then each token is indexed as a keyword.

```javascript
indexer.index('docid-123', 'hello world', function(err) {});
```

If the document ID is guaranteed to be unique, use `add` directly to gain efficiency.

```javascript
indexer.add('docid-123', 'hello world', function(err) {});
```

`add` can be also used to append more content to an existing document.

### Remove from index
Use `remove` to delete a document. If the document ID doesn't exist, it's a no-op.

```javascript
indexer.remove('docid-123', function(err) {});
```

### Search
Use `search` to query the index. The query is uncapitalized and tokenized into keywords
the same way as the document content. The IDs of documents match all the keywords are returned.

```javascript
indexer.search('hello world', function(err, docIds) {
  docIds.forEach(function(docId) {
    console.log(docId);
  });
});
```

### Match
Use `match` to find all the keywords prefix matching the given query.

```javascript
indexer.match('hell', function(err, keywords) {
  keywords.forEach(function(kw) {
    console.log(kw);
  });
});
```

## License
MIT.