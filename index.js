var async = require('async'),
    _ = require('underscore');

/**
 * A Redis based minimal search indexer.
 */
var RedisIndex = module.exports = function(options) {
  this.redisClient = options.redisClient;
  this.keyPrefix = options.keyPrefix || 'ri:';

  this.buildKeywordKey = function(keyword) {
    return this.keyPrefix + 'kw:' + keyword;
  };

  this.buildDocKey = function(docId) {
    return this.keyPrefix + 'doc:' + docId;
  };
};

/**
 * Indexes a document. If the document exists, remove it before adding the new content.
 */
RedisIndex.prototype.index = function(docId, docContent, callback) {
  var indexer = this;
  async.series([
      function(cb) {
        indexer.remove(docId, cb);
      },
      function(cb) {
        indexer.add(docId, docContent, cb);
      }
  ], callback);
};

/**
 * Adds/appends a document to the index. If the document exists, new content will be appended.
 */
RedisIndex.prototype.add = function(docId, docContent, callback) {
  var indexer = this;
  var keywords = indexer.tokenize(docContent);

  var multi = indexer.redisClient.multi();
  keywords.forEach(function(kw) {
    multi.sadd(indexer.buildKeywordKey(kw), docId)
        .sadd(indexer.buildDocKey(docId), kw);
  });
  multi.exec(callback);
};

/**
 * Removes a document from index.
 */
RedisIndex.prototype.remove = function(docId, callback) {
  var indexer = this;
  indexer.redisClient.smembers(indexer.buildDocKey(docId), function(err, keywords) {
    if (err) return callback(err);
    if (!keywords) return callback();

    var multi = indexer.redisClient.multi();
    keywords.forEach(function(kw) {
      multi.srem(indexer.buildKeywordKey(kw), docId);
    });
    multi.exec(callback);
  });
};

/**
 * Returns an array of all document IDs matching the given query.
 */
RedisIndex.prototype.search = function(query, callback) {
  var indexer = this;
  var keywords = this.tokenize(query);
  if (keywords.length === 0) {
    return callback(null, []);
  }

  this.redisClient.sinter(
      _.map(keywords, function(kw) {
        return indexer.buildKeywordKey(kw);
      }),
      callback);
};

/**
 * Returns an array of all the keywords matching the given query as prefix.
 */
RedisIndex.prototype.match = function(query, callback) {
  var q = query.trim();
  if (q.length === 0) {
    return callback(null, []);
  }
  var indexer = this;
  var cursor = 0;
  var keys = [];
  async.doUntil(
      function(iterCallback) {
        var matchPattern = indexer.buildKeywordKey(q.toLowerCase()) + '*';
        indexer.redisClient.scan([cursor, 'match', matchPattern], function(err, reply) {
          if (err) return iterCallback(err);
          cursor = parseInt(reply[0]);
          keys = keys.concat(_.map(reply[1], function(key) {
            return key.substr(indexer.keyPrefix.length + 3);
          }));
          iterCallback();
        });
      },
      function() {
        return cursor === 0;
      },
      function(err) {
        callback(err, keys);
      }
  );
};

RedisIndex.prototype.tokenize = function(str) {
  return _.compact(str.toLowerCase()
      .split(/[\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~ 　～·！＠＃￥％…＆×－—＝＋、，。｜？《》；：｛｝（）“”‘’【】]/));
};
