#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import readline from 'node:readline';

/**
 * Generates the bcrypt hash that goes into ADMIN_PIN_HASH.
 *
 *   npm run pin:hash
 *   npm run pin:hash -- 1234
 *
 * The plaintext PIN is only ever held in memory here. Nothing is printed to
 * disk except the hash.
 */
const argPin = process.argv[2];

const askHidden = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const stdout = process.stdout;
    const originalWrite = stdout.write.bind(stdout);
    let muted = false;

    stdout.write = (chunk, ...rest) => {
      if (chunk.includes(question)) {
        muted = true;
        return originalWrite(question, ...rest);
      }
      return muted ? true : originalWrite(chunk, ...rest);
    };

    rl.question(question, (answer) => {
      stdout.write = originalWrite;
      stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });

const run = async () => {
  const pin = argPin ?? (await askHidden('Choose an admin PIN: '));

  if (!pin || pin.length < 4) {
    console.error('PIN must be at least 4 characters.');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(pin, 12);

  console.log('');
  console.log('Add this line to server/.env (the plaintext PIN is NOT stored anywhere):');
  console.log('');
  console.log(`ADMIN_PIN_HASH=${hash}`);
  console.log('');
  console.log('Then remove any ADMIN_PIN= line and restart the server.');
};

run();