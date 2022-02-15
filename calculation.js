import fetch from 'node-fetch';
import dotenv from 'dotenv'

dotenv.config()

let assetSettings;
await fetch(process.env.SETTINGS_URL)
  .then((res) => res.json())
  .then((json) => assetSettings = json);

// constants
const MAX_RETRY = 1000
const TARGET_NUMBER = Infinity
const EXCEPT_PRIORITY = ['T2', 'T3']

// generate trait pool
let pool = {};
let traitsSet = new Set(); // for checking if all traits are used
for (const asset of assetSettings) {
  const { id, trait_name, rarity_ratio, priority } = asset;

  if (!rarity_ratio) {
    continue;
  }
  if (EXCEPT_PRIORITY.includes(priority)) {
    continue;
  }
  if (!pool[trait_name]) {
    pool[trait_name] = [];
  }
  for (let i = 0; i < rarity_ratio; i++) {
    pool[trait_name].push(id);
    traitsSet.add(id);
  }
}

// generate assets
let assetSet = new Set();
let counter = 0;
while (assetSet.size < TARGET_NUMBER) {
  let characterTraits = '';
  let retry = true;

  while (retry && counter < MAX_RETRY) {
    for (const idArray of Object.values(pool)) {
      // random pick
      const traitId = idArray[Math.floor(Math.random() * idArray.length)];
      characterTraits += traitId
    }
    if (!assetSet.has(characterTraits)) {
      retry = false;
    } else {
      counter++;
      console.log('retry', counter);
    }
  }
  
  if (counter >= MAX_RETRY) {
    console.log('max size', assetSet.size);
    break;
  }

  assetSet.add(characterTraits)
}
console.log(assetSet.size)
