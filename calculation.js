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
const EXCEPT_PRIORITIES = ['T2', 'T3']

// generate trait pool
const pool = {};
const fixedTraitIndex = {};
const traitsSet = new Set(); // for checking if all traits are used
for (const asset of assetSettings) {
  const { id, trait_name, rarity_ratio, priority, fixed_rules } = asset;

  if (!rarity_ratio) {
    continue;
  }
  if (EXCEPT_PRIORITIES.includes(priority)) {
    continue;
  }
  // create pool array
  if (!pool[trait_name]) {
    pool[trait_name] = [];
  }
  for (let i = 0; i < rarity_ratio; i++) {
    pool[trait_name].push(id);
    traitsSet.add(id);
  }
  // create trait index
  fixedTraitIndex[id] = fixed_rules;
}

// generate assets
const assetSet = new Set();
let counter = 0;
while (assetSet.size < TARGET_NUMBER) {
  let characterTraits = '';
  let retry = true;

  const poolArrays = Object.values(pool);
  // TODO: exception rules
  while (retry && counter < MAX_RETRY) {
    const addedType = new Set();
    const needForceAdded = {}
    for (const idArray of poolArrays) {
      // check if need to force added
      const currentType = idArray[0].split('-')[0]
      if (needForceAdded[currentType]) {
        characterTraits += needForceAdded[currentType]
        continue;
      }

      // random pick
      const traitId = idArray[Math.floor(Math.random() * idArray.length)];
      // check if the trait type has been added
      const type = traitId.split('-')[0];
      if (addedType.has(type)) {
        continue;
      }
      // add the trait with id
      characterTraits += traitId;
      addedType.add(type);
      // add force added list
      const fixedTraitIds =  fixedTraitIndex[traitId];
      if (fixedTraitIds && fixedTraitIds.length > 0) {
        fixedTraitIds.forEach(traitId => {
          const fixedTraitType = traitId.split('-')[0]
          if (needForceAdded[fixedTraitType]) {
            throw Error('CONFLICT');
          }
          needForceAdded[fixedTraitType] = traitId;
        });
      }
    }
    if (!assetSet.has(characterTraits)) {
      retry = false;
    } else {
      characterTraits = ''
      counter++;
      // console.log('retry', counter);
    }
  }
  
  if (counter >= MAX_RETRY) {
    break;
  }

  assetSet.add(characterTraits);
  console.log(characterTraits);
}
console.log('MAX SIZE:', assetSet.size);
