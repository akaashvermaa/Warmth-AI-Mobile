
const { streamChatMessage } = require('../src/services/streamingUtils');

// Mock XMLHttpRequest
class MockXHR {
  constructor() {
    this.headers = {};
    this.readyState = 0;
    this.status = 0;
    this.responseText = '';
    this.onreadystatechange = null;
    this.onerror = null;
  }

  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }

  setRequestHeader(key, value) {
    this.headers[key] = value;
  }

  send(body) {
    this.body = body;
    // Simulate async network behavior
    setTimeout(() => this.simulateServerResponse(), 100);
  }

  simulateServerResponse() {
    this.status = 200;
    this.readyState = 3;
    
    // Simulate chunks arriving
    const chunks = [
      'data: {"token": "Hello"}\n\n',
      'data: {"token": " world"}\n\n',
      'data: {"token": "!"}\n\n',
      'data: [DONE]\n\n'
    ];

    let currentText = '';
    
    const sendChunk = (index) => {
      if (index >= chunks.length) {
        this.readyState = 4;
        if (this.onreadystatechange) this.onreadystatechange();
        return;
      }

      currentText += chunks[index];
      this.responseText = currentText;
      if (this.onreadystatechange) this.onreadystatechange();

      setTimeout(() => sendChunk(index + 1), 50);
    };

    sendChunk(0);
  }
}

// Mock split chunk behavior (simulating network fragmentation)
class MockXHR_Split {
    constructor() {
      this.headers = {};
      this.readyState = 0;
      this.status = 0;
      this.responseText = '';
      this.onreadystatechange = null;
      this.onerror = null;
    }
  
    open(method, url) {
      this.method = method;
      this.url = url;
      this.readyState = 1;
    }
  
    setRequestHeader(key, value) {
      this.headers[key] = value;
    }
  
    send(body) {
      this.body = body;
      setTimeout(() => this.simulateServerResponse(), 100);
    }
  
    simulateServerResponse() {
      this.status = 200;
      this.readyState = 3;
      
      // Simulate a split JSON chunk
      // Chunk 1: Complete token + Partial token
      // Chunk 2: Rest of partial token + Complete token
      const updates = [
        'data: {"token": "Start"}\n\ndata: {"to', // Incomplete
        'ken": " Middle"}\n\ndata: {"token": " End"}\n\ndata: [DONE]\n\n' // Completion
      ];
  
      let currentText = '';
      
      const sendUpdate = (index) => {
        if (index >= updates.length) {
          this.readyState = 4;
          if (this.onreadystatechange) this.onreadystatechange();
          return;
        }
  
        currentText += updates[index];
        this.responseText = currentText;
        if (this.onreadystatechange) this.onreadystatechange();
  
        setTimeout(() => sendUpdate(index + 1), 50);
      };
  
      sendUpdate(0);
    }
  }

global.XMLHttpRequest = MockXHR;

async function runTests() {
  console.log('--- Test 1: Normal Streaming ---');
  let receivedText = '';
  await streamChatMessage(
    'http://test',
    'token',
    'hi',
    (token) => { process.stdout.write(token); receivedText += token; },
    () => console.log('\nDone!'),
    (err) => console.error('Error:', err)
  );
  
  if (receivedText === 'Hello world!') {
      console.log('Test 1 PASSED');
  } else {
      console.error('Test 1 FAILED: Expected "Hello world!", got "' + receivedText + '"');
  }

  console.log('\n--- Test 2: Split Chunk Streaming ---');
  global.XMLHttpRequest = MockXHR_Split;
  receivedText = '';
  await streamChatMessage(
    'http://test',
    'token',
    'hi',
    (token) => { process.stdout.write(token); receivedText += token; },
    () => console.log('\nDone!'),
    (err) => console.error('Error:', err)
  );

  if (receivedText === 'Start Middle End') {
      console.log('Test 2 PASSED');
  } else {
      console.error('Test 2 FAILED: Expected "Start Middle End", got "' + receivedText + '"');
  }
}

runTests();
