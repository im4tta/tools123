export interface WordBankEntry {
  text: string;
  clue: string;
}

export interface WordBank {
  id: string;
  label: string;
  entries: WordBankEntry[];
}

export const WORD_BANKS: WordBank[] = [
  {
    id: "animals",
    label: "Animals",
    entries: [
      { text: "ឆ្កែ", clue: "Dog" },
      { text: "ឆ្មា", clue: "Cat" },
      { text: "ត្រី", clue: "Fish" },
      { text: "ស្វា", clue: "Monkey" },
      { text: "មាន់", clue: "Chicken" },
      { text: "គោ", clue: "Cow" },
      { text: "ដំរី", clue: "Elephant" },
      { text: "កង្កែប", clue: "Frog" },
      { text: "សេះ", clue: "Horse" },
      { text: "ជ្រូក", clue: "Pig" },
      { text: "ខ្លា", clue: "Tiger" },
      { text: "សិង្ហ", clue: "Lion" },
      { text: "ក្របី", clue: "Water buffalo" },
      { text: "ទា", clue: "Duck" },
      { text: "ពស់", clue: "Snake" },
      { text: "ខ្លាឃ្មុំ", clue: "Bear" },
    ],
  },
  {
    id: "colors",
    label: "Colors",
    entries: [
      { text: "ក្រហម", clue: "Red" },
      { text: "លឿង", clue: "Yellow" },
      { text: "ខៀវ", clue: "Blue" },
      { text: "បៃតង", clue: "Green" },
      { text: "ស", clue: "White" },
      { text: "ខ្មៅ", clue: "Black" },
      { text: "ទឹកក្រូច", clue: "Orange" },
      { text: "ស្វាយ", clue: "Purple" },
      { text: "ត្នោត", clue: "Brown" },
      { text: "ប្រផេះ", clue: "Gray" },
    ],
  },
  {
    id: "numbers",
    label: "Numbers 1–10",
    entries: [
      { text: "មួយ", clue: "One" },
      { text: "ពីរ", clue: "Two" },
      { text: "បី", clue: "Three" },
      { text: "បួន", clue: "Four" },
      { text: "ប្រាំ", clue: "Five" },
      { text: "ប្រាំមួយ", clue: "Six" },
      { text: "ប្រាំពីរ", clue: "Seven" },
      { text: "ប្រាំបី", clue: "Eight" },
      { text: "ប្រាំបួន", clue: "Nine" },
      { text: "ដប់", clue: "Ten" },
    ],
  },
  {
    id: "family",
    label: "Family",
    entries: [
      { text: "ឪពុក", clue: "Father" },
      { text: "ម្តាយ", clue: "Mother" },
      { text: "បង", clue: "Older sibling" },
      { text: "ប្អូន", clue: "Younger sibling" },
      { text: "កូន", clue: "Child" },
      { text: "ជីតា", clue: "Grandfather" },
      { text: "ជីដូន", clue: "Grandmother" },
      { text: "ប្រពន្ធ", clue: "Wife" },
      { text: "ប្តី", clue: "Husband" },
      { text: "ចៅ", clue: "Grandchild" },
      { text: "មីង", clue: "Aunt" },
      { text: "ពូ", clue: "Uncle" },
    ],
  },
  {
    id: "food",
    label: "Food",
    entries: [
      { text: "បាយ", clue: "Rice" },
      { text: "សាច់", clue: "Meat" },
      { text: "បន្លែ", clue: "Vegetable" },
      { text: "ផ្លែឈើ", clue: "Fruit" },
      { text: "ទឹក", clue: "Water" },
      { text: "នំបុ័ង", clue: "Bread" },
      { text: "ស្ករ", clue: "Sugar" },
      { text: "អំបិល", clue: "Salt" },
      { text: "ម្ទេស", clue: "Chili" },
      { text: "ខ្ទឹមស", clue: "Garlic" },
      { text: "ស៊ុប", clue: "Soup" },
    ],
  },
  {
    id: "school",
    label: "School",
    entries: [
      { text: "សៀវភៅ", clue: "Book" },
      { text: "ខ្មៅដៃ", clue: "Pencil" },
      { text: "ក្រដាស", clue: "Paper" },
      { text: "គ្រូ", clue: "Teacher" },
      { text: "សិស្ស", clue: "Student" },
      { text: "តុ", clue: "Table" },
      { text: "កៅអី", clue: "Chair" },
      { text: "ប៊ិក", clue: "Pen" },
      { text: "ក្តារខៀន", clue: "Blackboard" },
    ],
  },
  {
    id: "provinces",
    label: "Cambodian provinces",
    entries: [
      { text: "ភ្នំពេញ", clue: "Capital city, on the Mekong" },
      { text: "កំពង់ចាម", clue: "Province, an old French bridge town" },
      { text: "កំពង់ធំ", clue: 'Province whose name means "big port"' },
      { text: "កំពង់ស្ពឺ", clue: "Province between the capital and the coast" },
      { text: "កំពត", clue: "Province famous for its pepper" },
      { text: "សៀមរាប", clue: "Gateway to Angkor" },
      { text: "តាកែវ", clue: "Province south of the capital" },
      { text: "ស្វាយរៀង", clue: "Border province toward Vietnam" },
      { text: "បាត់ដំបង", clue: "Rice bowl of Cambodia" },
      { text: "ព្រះសីហនុ", clue: "Cambodia's main coastal city" },
      { text: "ភ្នំ", clue: 'Word for "mountain"' },
    ],
  },
];
