var async = require('async'),
    _ = require('underscore');

var RedisIndex = function(options) {
  this.redisClient = options.redisClient;
  this.keyPrefix = options.keyPrefix || 'ri:';

  this.buildKeywordKey = function(keyword) {
    return this.keyPrefix + 'kw:' + keyword;
  };

  this.buildDocKey = function(docId) {
    return this.keyPrefix + 'doc:' + docId;
  };
};

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

RedisIndex.prototype.search = function(query, callback) {
  console.log('searcj');
  var indexer = this;
  var keywords = this.tokenize(query);
  this.redisClient.sinter(
      _.map(keywords, function(kw) {
        return indexer.buildKeywordKey(kw);
      }),
      callback);
};

RedisIndex.prototype.match = function(query, callback) {
  var indexer = this;
  var cursor = 0;
  var keys = [];
  async.doUntil(
      function(iterCallback) {
        var matchPattern = indexer.buildKeywordKey(query.toLowerCase()) + '*';
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

module.exports = RedisIndex;
