// currency_backbone.js - the value table, price resolution, and the purse.
//
// Everything here is in base units (copper coins). The four defects this module
// shipped with are each pinned by a test below, since three of them were the
// kind that return a plausible-looking number rather than throwing:
//
//   - a capital-S "Silver_slab" that made the lowercase id undefined;
//   - getItemValueInCurrency running an already-absolute value back through the
//     metal's rate, so a gold ingot reported 100x its own value;
//   - compareCurrencyInputs reading only the metal, so a coin and a slab of the
//     same metal compared equal;
//   - float division.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CUR_TYPES,
  CUR_SUBTYPES,
  CURRENCIES,
  CURRENCY_CONVERSION_RATES,
  emptyPurse,
  toBase,
  currencyValue,
  currencyInputToBase,
  compareCurrencyInputs,
  purseTotal,
  addToPurse,
  spendFrom,
  decomposeBase,
  formatBase,
  formatCurrency,
} from "../../currency_backbone.js";

// --- The table --------------------------------------------------------------

test("copper is the base unit and the metal ratios are the long-standing ones", () => {
  assert.equal(CURRENCY_CONVERSION_RATES.copper, 1);
  assert.equal(CURRENCY_CONVERSION_RATES.silver, 10, "silver is 10x copper");
  assert.equal(CURRENCY_CONVERSION_RATES.gold, 20, "gold is 2x silver");
  assert.equal(CURRENCY_CONVERSION_RATES.syllic, 100, "syllic is 5x gold");
  assert.deepEqual(CUR_TYPES, ["copper", "silver", "gold", "syllic"], "bronze is gone");
});

test("every metal x subtype exists, lowercase, with the right value", () => {
  assert.equal(Object.keys(CURRENCIES).length, CUR_TYPES.length * CUR_SUBTYPES.length);
  for (const id of Object.keys(CURRENCIES)) {
    assert.equal(id, id.toLowerCase(), `${id} should be lowercase`);
  }
  // The one that used to be "Silver_slab" and so was unreachable by convention.
  assert.equal(CURRENCIES.silver_slab.value, 1000);
  assert.equal(CURRENCIES.copper_coin.value, 1);
  assert.equal(CURRENCIES.gold_ingot.value, 200);
  assert.equal(CURRENCIES.syllic_slab.value, 10000);
});

test("an ingot is ten of its coin and a slab a hundred", () => {
  for (const type of CUR_TYPES) {
    const coin = CURRENCIES[`${type}_coin`].value;
    assert.equal(CURRENCIES[`${type}_ingot`].value, coin * 10, `${type} ingot`);
    assert.equal(CURRENCIES[`${type}_slab`].value, coin * 100, `${type} slab`);
  }
});

// Load-bearing for spendFrom: breaking a coin can only ever yield whole coins
// if every metal divides evenly into the ones below it.
test("each metal divides evenly into every smaller one", () => {
  const rates = CUR_TYPES.map((type) => CURRENCY_CONVERSION_RATES[type]).sort((a, b) => a - b);
  for (let i = 1; i < rates.length; i++) {
    for (let j = 0; j < i; j++) {
      assert.equal(rates[i] % rates[j], 0, `${rates[i]} should divide by ${rates[j]}`);
    }
  }
});

// --- Prices -----------------------------------------------------------------

test("toBase() defaults to copper coins, so a bare `value` means what it always did", () => {
  assert.equal(toBase(150), 150);
  assert.equal(toBase(150, "copper"), 150);
  assert.equal(toBase(150, "copper", "coin"), 150);
});

test("toBase() resolves the metal and the denomination together", () => {
  assert.equal(toBase(3, "gold"), 60, "3 gold coins");
  assert.equal(toBase(3, "gold", "ingot"), 600, "3 gold ingots");
  assert.equal(toBase(3, "gold", "slab"), 6000, "3 gold slabs");
  assert.equal(toBase(1, "syllic"), 100);
});

test("toBase() refuses a metal or denomination it doesn't know", () => {
  assert.throws(() => toBase(1, "bronze"), /Unknown currency type/, "bronze was dropped");
  assert.throws(() => toBase(1, "gold", "bar"), /Unknown currency subtype/);
});

// The defect: item.value is already absolute, so running it back through the
// metal's rate multiplied twice. Only the base metal came out right.
test("currencyValue() does not re-apply the metal's rate", () => {
  assert.equal(currencyValue("gold_ingot"), 200, "not 200 * 20");
  assert.equal(currencyValue("gold_coin"), 20);
  assert.equal(currencyValue("copper_coin"), 1);
  for (const [id, entry] of Object.entries(CURRENCIES)) {
    assert.equal(currencyValue(id), entry.value, `${id} should report its own value`);
  }
});

test("currencyInputToBase() reads the whole denomination, not just the metal", () => {
  assert.equal(currencyInputToBase("gold_coin,1"), 20);
  assert.equal(currencyInputToBase("gold_slab,1"), 2000);
  assert.equal(currencyInputToBase("gold_ingot,5"), 1000);
  assert.equal(currencyInputToBase("copper_coin"), 1, "a missing count means one");
});

test("currencyInputToBase() rejects a bad id or a non-integer count", () => {
  assert.throws(() => currencyInputToBase("silver,10"), /Invalid currency id/, "that's a type, not an id");
  assert.throws(() => currencyInputToBase("copper_coin,2.5"), /Invalid currency count/);
  assert.throws(() => currencyInputToBase("copper_coin,many"), /Invalid currency count/);
});

// The defect: both sides priced as coins, so these compared equal.
test("compareCurrencyInputs() tells a coin from a slab of the same metal", () => {
  assert.equal(compareCurrencyInputs("gold_coin,1", "gold_slab,1"), 20 - 2000);
  assert.equal(compareCurrencyInputs("gold_ingot,5", "copper_coin,1"), 1000 - 1);
  assert.equal(compareCurrencyInputs("silver_coin,2", "copper_coin,20"), 0, "genuinely equal");
});

// --- The purse --------------------------------------------------------------

test("emptyPurse() has a slot per metal, all zero, and totals nothing", () => {
  assert.deepEqual(emptyPurse(), { copper: 0, silver: 0, gold: 0, syllic: 0 });
  assert.equal(purseTotal(emptyPurse()), 0);
  assert.equal(purseTotal(undefined), 0, "a missing purse is worth nothing, not NaN");
});

test("purseTotal() sums the slots in base units", () => {
  assert.equal(purseTotal({ copper: 4, silver: 3, gold: 1, syllic: 10 }), 4 + 30 + 20 + 1000);
});

test("addToPurse() pays in the named metal, keeping the change small", () => {
  // Being paid in syllic leaves syllic - the purse holds what it was given.
  assert.deepEqual(addToPurse(emptyPurse(), 100, "syllic"), { copper: 0, silver: 0, gold: 0, syllic: 1 });
  // What won't divide settles downward, largest first.
  assert.deepEqual(addToPurse(emptyPurse(), 45, "gold"), { copper: 5, silver: 0, gold: 2, syllic: 0 });
  assert.deepEqual(addToPurse(emptyPurse(), 145, "syllic"), { copper: 5, silver: 0, gold: 2, syllic: 1 });
  assert.equal(purseTotal(addToPurse(emptyPurse(), 145, "syllic")), 145, "value is conserved");
});

test("addToPurse() defaults to copper and adds to what's already there", () => {
  assert.deepEqual(addToPurse({ copper: 2, silver: 0, gold: 0, syllic: 0 }, 3), {
    copper: 5,
    silver: 0,
    gold: 0,
    syllic: 0,
  });
});

test("addToPurse() refuses fractions and negatives", () => {
  assert.throws(() => addToPurse(emptyPurse(), 1.5), /whole/);
  assert.throws(() => addToPurse(emptyPurse(), -5), /negative/);
});

test("spendFrom() takes the small change first rather than breaking a big coin", () => {
  const purse = { copper: 5, silver: 0, gold: 0, syllic: 11 };
  // Three loose coppers are right there - the syllic should not be touched.
  assert.deepEqual(spendFrom(purse, 3), { copper: 2, silver: 0, gold: 0, syllic: 11 });
});

test("spendFrom() breaks the smallest coin that covers the rest", () => {
  // No copper at all, so a single syllic has to go - and the change comes back
  // canonically rather than as ninety-odd copper.
  const spent = spendFrom({ copper: 0, silver: 0, gold: 0, syllic: 11 }, 10);
  assert.equal(purseTotal(spent), 1100 - 10);
  assert.deepEqual(spent, { copper: 0, silver: 1, gold: 4, syllic: 10 });
});

test("spendFrom() prefers breaking a small coin over a large one", () => {
  // Both a gold and a syllic could cover 15; the gold is the right one to break.
  const spent = spendFrom({ copper: 0, silver: 0, gold: 1, syllic: 1 }, 15);
  assert.deepEqual(spent, { copper: 5, silver: 0, gold: 0, syllic: 1 });
  assert.equal(purseTotal(spent), 120 - 15);
});

test("spendFrom() handles exact change and spending everything", () => {
  assert.deepEqual(spendFrom({ copper: 0, silver: 0, gold: 1, syllic: 0 }, 20), emptyPurse());
  assert.deepEqual(spendFrom(emptyPurse(), 0), emptyPurse(), "spending nothing is fine");
});

test("spendFrom() returns null when the purse is short, and changes nothing", () => {
  const purse = { copper: 1, silver: 0, gold: 0, syllic: 0 };
  assert.equal(spendFrom(purse, 2), null);
  assert.deepEqual(purse, { copper: 1, silver: 0, gold: 0, syllic: 0 }, "the caller's purse is untouched");
});

test("spendFrom() never invents or destroys value", () => {
  const purse = { copper: 3, silver: 2, gold: 4, syllic: 7 };
  const total = purseTotal(purse);
  for (let amount = 0; amount <= total; amount += 7) {
    const spent = spendFrom(purse, amount);
    assert.ok(spent, `should afford ${amount} of ${total}`);
    assert.equal(purseTotal(spent), total - amount, `spending ${amount}`);
    for (const [type, count] of Object.entries(spent)) {
      assert.ok(Number.isInteger(count) && count >= 0, `${type} stayed a whole non-negative count`);
    }
  }
});

// --- Display ----------------------------------------------------------------

test("decomposeBase() breaks an amount down the canonical coin ladder", () => {
  assert.deepEqual(decomposeBase(0), {});
  assert.deepEqual(decomposeBase(1), { copper: 1 });
  assert.deepEqual(decomposeBase(137), { syllic: 1, gold: 1, silver: 1, copper: 7 });
  assert.deepEqual(decomposeBase(100), { syllic: 1 }, "exactly one syllic, not five gold");
});

test("formatBase() renders long and short, and says something at zero", () => {
  assert.equal(formatBase(137), "1 syllic, 1 gold, 1 silver, 7 copper");
  assert.equal(formatBase(137, { short: true }), "1sy 1g 1s 7c");
  assert.equal(formatBase(0), "0 copper");
  assert.equal(formatBase(0, { short: true }), "0c");
});

// The distinction that makes independent holdings visible: eleven syllic coins
// read as eleven syllic, not as the gold and silver they could be broken into.
test("formatCurrency() shows what the purse holds, not the canonical breakdown", () => {
  const purse = { copper: 0, silver: 0, gold: 0, syllic: 11 };
  assert.equal(formatCurrency(purse), "11 syllic");
  assert.equal(formatCurrency(purse, { short: true }), "11sy");
  assert.equal(formatBase(purseTotal(purse)), "11 syllic", "which here happens to agree");

  const loose = { copper: 100, silver: 0, gold: 0, syllic: 0 };
  assert.equal(formatCurrency(loose), "100 copper", "a hoard of copper stays copper");
  assert.equal(formatBase(purseTotal(loose)), "1 syllic", "even though it is worth one syllic");
});

test("formatCurrency() skips empty slots and handles an empty purse", () => {
  assert.equal(formatCurrency({ copper: 5, silver: 0, gold: 2, syllic: 0 }), "2 gold, 5 copper");
  assert.equal(formatCurrency(emptyPurse()), "0 copper");
});
