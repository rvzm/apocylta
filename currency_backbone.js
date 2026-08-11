// apocylta currency backbone
//
// Four metals, three denominations each, and ONE base unit: the copper coin.
// Every value in this file is an integer count of copper coins, and every
// function takes and returns those base units - there is no floating-point
// money anywhere, which is deliberate. Dividing into larger denominations is a
// display concern (formatBase below), never an arithmetic one.
//
// The ratios are the long-standing ones (silver 10x copper, gold 2x silver,
// syllic 5x gold); only the unit moved when bronze was dropped and copper took
// its place at the bottom.
//
// COINS ARE THE LADDER. Ingots and slabs are bulk packaging - an ingot is
// exactly 10 coins of its metal and a slab exactly 100 - so they are worth
// something but are not their own tier. That is why the purse (state.cur) has
// four slots and not twelve, and why values collide across denominations: a
// copper_slab, a silver_ingot and a syllic_coin are all 100 base units, because
// they are all genuinely worth the same. Anything that decomposes an amount for
// display therefore has to pick a canonical ladder, and that ladder is COINS -
// see BASE_LADDER - so an amount always formats exactly one way.
export const CUR_TYPES = ["copper", "silver", "gold", "syllic"];
export const CUR_SUBTYPES = ["coin", "ingot", "slab"];

// What one coin of each metal is worth in base units (copper coins).
export const CURRENCY_CONVERSION_RATES = {
    copper: 1,
    silver: 10,
    gold: 20,
    syllic: 100,
};

// What each denomination multiplies its metal's coin by.
export const SUBTYPE_MULTIPLIERS = {
    coin: 1,
    ingot: 10,
    slab: 100,
};

// Built rather than hand-written: the twelve entries are exactly the cross
// product of the two tables above, so they cannot drift out of step with them
// the way the old hand-maintained list did (it carried a "Silver_slab" whose
// capital S made CURRENCIES["silver_slab"] undefined).
export const CURRENCIES = Object.fromEntries(
    CUR_TYPES.flatMap((type) =>
        CUR_SUBTYPES.map((subtype) => [
            `${type}_${subtype}`,
            { type, subtype, value: CURRENCY_CONVERSION_RATES[type] * SUBTYPE_MULTIPLIERS[subtype] },
        ])
    )
);

// The canonical decomposition ladder, largest first. Coins only - see the
// header note on why ingots and slabs are excluded.
const BASE_LADDER = [...CUR_TYPES]
    .sort((a, b) => CURRENCY_CONVERSION_RATES[b] - CURRENCY_CONVERSION_RATES[a])
    .map((type) => [type, CURRENCY_CONVERSION_RATES[type]]);

// Smallest first, for spending.
const SPEND_LADDER = [...BASE_LADDER].reverse();

export function isCurrencyType(type) {
    return Object.hasOwn(CURRENCY_CONVERSION_RATES, type);
}

// An empty purse. The one place the four slots are named, so adding a metal
// means touching CUR_TYPES and nothing else.
export function emptyPurse() {
    return Object.fromEntries(CUR_TYPES.map((type) => [type, 0]));
}

// --- Prices -----------------------------------------------------------------

// The one price -> base-units resolver. A catalog entry declares
// `{ value, curType, curSubtype? }` and this turns it into base units:
// `{ value: 3, curType: "gold" }` is 60, and the same with
// `curSubtype: "ingot"` is 600.
//
// curType defaults to copper so an item carrying a bare `value` - which is most
// of item_backbone.js - keeps meaning exactly what it did.
export function toBase(value, curType = "copper", curSubtype = "coin") {
    const rate = CURRENCY_CONVERSION_RATES[curType];
    const multiplier = SUBTYPE_MULTIPLIERS[curSubtype];
    if (rate === undefined) throw new Error(`Unknown currency type: ${curType}`);
    if (multiplier === undefined) throw new Error(`Unknown currency subtype: ${curSubtype}`);
    return Math.round(value * rate * multiplier);
}

// Base units for a catalog entry, e.g. CURRENCIES.gold_ingot -> 200.
//
// This used to run item.value back through convertCurrency(value, item.type,
// ...), which multiplied by the metal's rate a second time - the value was
// already absolute - so a gold ingot reported 100,000 against its own value of
// 1000. Only bronze came out right, because bronze's rate was 1. The two jobs
// are separate now and no longer share an implementation.
export function currencyValue(itemId) {
    const entry = CURRENCIES[itemId];
    if (!entry) throw new Error(`Invalid currency id: ${itemId}`);
    return entry.value;
}

// How many whole coins of `curType` an amount of base units is worth. Returns a
// float only if asked for a metal the amount doesn't divide into evenly, so
// callers that need a count should floor it themselves - money arithmetic
// should stay in base units and only convert at the edge.
export function convertCurrency(amount, fromCurrency, toCurrency) {
    const fromRate = CURRENCY_CONVERSION_RATES[fromCurrency];
    const toRate = CURRENCY_CONVERSION_RATES[toCurrency];
    if (fromRate === undefined || toRate === undefined) {
        throw new Error(`Invalid currency type: ${fromCurrency} or ${toCurrency}`);
    }
    return (amount * fromRate) / toRate;
}

// Compares two "<currencyId>,<count>" inputs and returns the difference in base
// units - positive when the first is worth more.
//
// The old version read the item id, then threw away everything but its metal,
// so an ingot and a slab both priced as coins and one gold coin compared EQUAL
// to one gold slab. It resolves the whole denomination now.
export function compareCurrencyInputs(input1, input2) {
    return currencyInputToBase(input1) - currencyInputToBase(input2);
}

// "gold_ingot,5" -> 1000. Split out because comparing is not the only thing
// worth doing with one of these.
export function currencyInputToBase(input) {
    const [itemId, rawCount] = String(input).split(",");
    const entry = CURRENCIES[itemId];
    if (!entry) throw new Error(`Invalid currency id: ${itemId}`);

    // The count is optional and defaults to 1. Anything present but not a whole
    // number is an error rather than a silent NaN, which is what parseInt with
    // no radix and no guard used to produce.
    if (rawCount === undefined || rawCount === "") return entry.value;
    const count = Number(rawCount);
    if (!Number.isInteger(count)) throw new Error(`Invalid currency count: ${rawCount}`);
    return entry.value * count;
}

// --- The purse --------------------------------------------------------------

export function purseTotal(cur) {
    let total = 0;
    for (const [type, rate] of BASE_LADDER) total += (cur?.[type] ?? 0) * rate;
    return total;
}

// Adds `amount` base units to the purse as coins of one metal, plus whatever
// remainder won't divide into that metal, in smaller coins.
//
// Earnings deliberately do NOT get split into a tidy canonical breakdown: the
// purse holds what it was given (see the header note on independent holdings),
// so being paid 100 in syllic leaves you with one syllic coin and no change.
export function addToPurse(cur, amount, curType = "copper") {
    if (!Number.isInteger(amount)) throw new Error(`Currency amounts must be whole: ${amount}`);
    if (amount < 0) throw new Error(`Use spendFrom to take money out, not a negative add`);

    const rate = CURRENCY_CONVERSION_RATES[curType];
    if (rate === undefined) throw new Error(`Unknown currency type: ${curType}`);

    const next = { ...emptyPurse(), ...cur };
    next[curType] += Math.floor(amount / rate);

    // Whatever didn't divide evenly settles into smaller coins, largest first -
    // 45 paid in gold is 2 gold and 5 copper, not 2 gold and a fistful of 5.
    let remainder = amount % rate;
    for (const [type, typeRate] of BASE_LADDER) {
        if (typeRate >= rate || remainder <= 0) continue;
        next[type] += Math.floor(remainder / typeRate);
        remainder %= typeRate;
    }
    return next;
}

// Adds base units as the canonical breakdown - the change a shopkeeper hands
// back. Distinct from addToPurse, which pays in one named metal because that is
// what being *paid* looks like.
function addChange(purse, amount) {
    const next = { ...purse };
    for (const [type, count] of Object.entries(decomposeBase(amount))) next[type] += count;
    return next;
}

// A whole purse worth `amount`, split canonically.
//
// For SETTING a purse rather than adding to one: a starting character, the
// post-death reset, the admin editor. Nobody is handed 5500 copper coins - they
// get 55 syllic - so the "hold what you were given" rule that governs earnings
// doesn't apply to a purse being conjured from a number.
export function purseFromBase(amount) {
    return addChange(emptyPurse(), amount);
}

// Spends `amount` base units, returning the new purse - or null if the total is
// short, so the caller decides what "can't afford" means.
//
// Smallest coins first, and when they run out it breaks the SMALLEST coin big
// enough to cover what's left and carries on. Spending small change first is
// what keeps a purse usable: paying 3 copper out of 11 syllic should not
// shatter a syllic when three loose coppers are sitting right there.
//
// Every metal divides evenly into the ones below it (1 syllic = 5 gold = 10
// silver = 100 copper), so breaking always yields whole coins and a remainder
// can never be stranded.
export function spendFrom(cur, amount) {
    if (!Number.isInteger(amount)) throw new Error(`Currency amounts must be whole: ${amount}`);
    if (amount < 0) throw new Error(`Cannot spend a negative amount`);
    if (purseTotal(cur) < amount) return null;

    const next = { ...emptyPurse(), ...cur };
    let owed = amount;

    for (const [type, rate] of SPEND_LADDER) {
        if (owed <= 0) break;
        const spend = Math.min(next[type], Math.floor(owed / rate));
        next[type] -= spend;
        owed -= spend * rate;
    }

    // What's left is smaller than any coin still held, so break the smallest
    // coin that covers it and take the change back. The total was checked up
    // front, so such a coin exists and one break always finishes the job.
    if (owed > 0) {
        const breaking = SPEND_LADDER.find(([type, rate]) => next[type] > 0 && rate >= owed);
        if (!breaking) return null; // unreachable given the total check, but don't lie about it
        const [type, rate] = breaking;
        next[type] -= 1;
        return addChange(next, rate - owed);
    }

    return next;
}

// --- Display ----------------------------------------------------------------

const SHORT_NAMES = { copper: "c", silver: "s", gold: "g", syllic: "sy" };

// Decomposes base units down the canonical coin ladder. This is a DISPLAY
// breakdown, not what the purse holds - see formatCurrency for that.
export function decomposeBase(amount) {
    const out = {};
    let remainder = amount;
    for (const [type, rate] of BASE_LADDER) {
        const count = Math.floor(remainder / rate);
        if (count) out[type] = count;
        remainder -= count * rate;
    }
    return out;
}

// "1 gold, 7 copper" / "1g 7c". The short form exists because ui/layout.js's
// header column is narrow enough that a long player name can already push the
// purse off the end of it.
export function formatBase(amount, { short = false } = {}) {
    const parts = Object.entries(decomposeBase(amount));
    if (!parts.length) return short ? "0c" : "0 copper";
    return parts
        .map(([type, count]) => (short ? `${count}${SHORT_NAMES[type]}` : `${count} ${type}`))
        .join(short ? " " : ", ");
}

// What the purse actually holds, which under independent holdings is not
// necessarily the canonical breakdown of its total - eleven syllic coins read
// as "11 syllic", not as the gold and silver they could be broken into.
export function formatCurrency(cur, { short = false } = {}) {
    const parts = BASE_LADDER.filter(([type]) => (cur?.[type] ?? 0) > 0).map(([type]) =>
        short ? `${cur[type]}${SHORT_NAMES[type]}` : `${cur[type]} ${type}`
    );
    if (!parts.length) return short ? "0c" : "0 copper";
    return parts.join(short ? " " : ", ");
}
