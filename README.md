# RedisIndex.js

RedisIndex is a [Redis](http://redis.io) based minimal search indexer for NodeJS.

## API
Check test.js for more examples.

### Install
```
npm install redisindex --save
```

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
Use `index` to add a document. If the document ID exists, it will be 
removed and re-added with the new content. The content is uncapitalized 
and tokenized on white spaces and punctuations. Then each token is indexed as a keyword.

```javascript
indexer.index('docid-123', 'hello world', function(err) {});
```

If the document ID is guaranteed to be unique, use `add` directly to gain efficiency.

```javascript
indexer.add('docid-123', 'hello world', function(err) {});
```

`add` can also be used to append extra content to an existing document.

### Remove from index
Use `remove` to delete a document. It's a no-op if the document ID doesn't exist;

```javascript
indexer.remove('docid-123', function(err) {});
```

### Search
Use `search` to query the index. The query is uncapitalized and tokenized into keywords
the same way as the document content. The IDs of documents matching all the keywords are returned.

```javascript
indexer.search('hello world', function(err, docIds) {
  docIds.forEach(function(docId) {
    console.log(docId);
  });
});
```

## License
MIT.