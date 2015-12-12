var RedisIndex = require('./index.js'),
    fakeRedis = require('fakeredis').createClient(),
    test = require('tape');

var indexer = new RedisIndex({ redisClient: fakeRedis });

test('Index a doc', function (t) {
  t.plan(4);
  indexer.index('001', 'hello world!', function() {
    indexer.search('hello', function(err, docIds) {
      t.deepEqual(docIds, ['001'], 'matched query');
    });

    indexer.search('halo', function(err, docIds) {
      t.deepEqual(docIds, [], 'unmatched query');
    });

    indexer.search('', function(err, docIds) {
      t.deepEqual(docIds, [], 'empty query');
    });

    indexer.search(' ', function(err, docIds) {
      t.deepEqual(docIds, [], 'white space query');
    });
  });
});

test('Re-index a doc', function (t) {
  t.plan(2);
  indexer.index('001', 'halo world!', function() {
    indexer.search('halo', function (err, docIds) {
      t.deepEqual(docIds, ['001'], 'matched query');
    });

    indexer.search('hello', function (err, docIds) {
      t.deepEqual(docIds, [], 'unmatched query');
    });
  });
});

test('Index another doc', function (t) {
  t.plan(2);
  indexer.index('002', 'hooray world!', function() {
    indexer.search('world', function (err, docIds) {
      t.deepEqual(docIds, ['001', '002'], 'query matches 2 docs');
    });

    indexer.search('hooray', function (err, docIds) {
      t.deepEqual(docIds, ['002'], 'query matches 1 doc');
    });
  });
});

test('Remove a doc', function (t) {
  t.plan(1);
  indexer.remove('001', function() {
    indexer.search('halo', function (err, docIds) {
      t.deepEqual(docIds, [], 'unmatched query');
    });
  });
});

test('Remove a non-existing doc', function (t) {
  indexer.remove('005', function() {
    t.end();
  });
});

test('Add a new doc', function (t) {
  t.plan(1);
  indexer.add('004', 'Awesome...world', function() {
    indexer.search('awesome', function (err, docIds) {
      t.deepEqual(docIds, ['004'], 'matched query');
    });
  });
});

test('Add to existing doc', function (t) {
  t.plan(1);
  indexer.add('004', 'something awful', function() {
    indexer.search('awesome awful', function (err, docIds) {
      t.deepEqual(docIds, ['004'], 'matched query');
    });
  });
});

test('中文搜索', function (t) {
  t.plan(2);
  indexer.index('003', '美好的 世界', function() {
    indexer.search('世界', function (err, docIds) {
      t.deepEqual(docIds, ['003'], 'matched query');
    });

    indexer.search('随便搜索', function (err, docIds) {
      t.deepEqual(docIds, [], 'unmatched query');
    });
  });
});

test('Multi words query', function(t) {
  t.plan(3);
  indexer.search('hooray world', function (err, docIds) {
    t.deepEqual(docIds, ['002'], 'exact match');
  });

  indexer.search('世界  美好的', function (err, docIds) {
    t.deepEqual(docIds, ['003'], 'matched all keywords but in alternated order');
  });

  indexer.search('hooray world 世界', function (err, docIds) {
    t.deepEqual(docIds, [], 'not all keywords matched');
  });
});

test('Tokenizer', function (t) {
  t.deepEqual(indexer.tokenize("I'm yours!"), ['i', 'm', 'yours']);
  t.deepEqual(indexer.tokenize(" 美好，的（世界），哈哈。你好 "), ['美好', '的', '世界', '哈哈', '你好']);
  t.deepEqual(indexer.tokenize("《美好》的“世界”‘哈　哈’【你好】"), ['美好', '的', '世界', '哈', '哈', '你好']);
  t.deepEqual(indexer.tokenize("   "), []);
  t.deepEqual(indexer.tokenize("! - ,   "), []);

  t.end();
});