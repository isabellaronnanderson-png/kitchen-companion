import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Shuffle, Share2, Copy, Clock, Image as ImageIcon } from 'lucide-react';

/* ---------------------------------- tokens ---------------------------------- */

const COLORS = {
  paper: '#DCE8D3',
  paperDark: '#BBDDB4',
  card: '#FFFFFF',
  cardEdge: 'rgba(22,22,22,0.14)',
  ink: '#161616',
  inkSoft: 'rgba(22,22,22,0.6)',
  oxblood: '#161616',
  oxbloodDark: '#000000',
  forest: '#355E3B',
  mustard: '#355E3B',
  cream: '#FFFFFF',
  orange: '#161616',
  lightBlue: '#DCE8D3',
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Libre Baskerville', Georgia, serif";
const FONT_STAMP = "'Inter', -apple-system, sans-serif";
const FONT_SCRIPT = "'Permanent Marker', cursive";
const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

const TAGS = [
  { key: 'weekdayBreakfast', label: 'Weekday Breakfast' },
  { key: 'mealprepLunch', label: 'Mealprep Lunch' },
  { key: 'mealprepDinner', label: 'Mealprep Dinner' },
  { key: 'weekdaySnack', label: 'Weekday Snack' },
  { key: 'weekendBreakfast', label: 'Weekend Breakfast' },
  { key: 'weekendLunch', label: 'Weekend Lunch' },
  { key: 'weekendDinner', label: 'Weekend Dinner' },
  { key: 'weekendSnack', label: 'Weekend Snack' },
];
const TAG_LABEL = Object.fromEntries(TAGS.map(t => [t.key, t.label]));

const CATEGORIES = ['Produce', 'Dairy & Eggs', 'Pantry', 'Protein', 'Frozen', 'Bakery', 'Other'];

const SLOT_DEFS = {
  weekday: [
    { id: 'breakfast', label: 'Breakfast — whole week', tag: 'weekdayBreakfast', defaultTimes: 5 },
    { id: 'lunch', label: 'Mealprep Lunch', tag: 'mealprepLunch', defaultTimes: 4 },
    { id: 'dinner1', label: 'Dinner — Option 1', tag: 'mealprepDinner', defaultTimes: 3 },
    { id: 'dinner2', label: 'Dinner — Option 2', tag: 'mealprepDinner', defaultTimes: 2 },
    { id: 'snack', label: 'Snack', tag: 'weekdaySnack', defaultTimes: 5 },
  ],
  weekend: [
    { id: 'breakfast', label: 'Weekend Breakfast', tag: 'weekendBreakfast', defaultTimes: 2 },
    { id: 'lunch', label: 'Weekend Lunch', tag: 'weekendLunch', defaultTimes: 2 },
    { id: 'dinner', label: 'Weekend Dinner', tag: 'weekendDinner', defaultTimes: 2 },
    { id: 'snack', label: 'Weekend Snack', tag: 'weekendSnack', defaultTimes: 2 },
  ],
};

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function round1(n) { return Math.round((n + Number.EPSILON) * 10) / 10; }
function pantryKey(name, unit) { return `${(name || '').trim().toLowerCase()}|${(unit || '').trim().toLowerCase()}`; }

function fileToResizedDataUrl(file, maxDim = 640, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height >= width && height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------- seed data ---------------------------------- */

const SEED_RECIPES = [
  {
    id: uid(), name: 'Overnight Oats with Berries', vegetarian: true, servings: 1,
    calories: 380, protein: 18, carbs: 52, veggieServings: 0.5,
    tags: ['weekdayBreakfast'],
    ingredients: [
      { name: 'Rolled oats', qty: 80, unit: 'g', category: 'Pantry' },
      { name: 'Milk', qty: 150, unit: 'ml', category: 'Dairy & Eggs' },
      { name: 'Greek yogurt', qty: 100, unit: 'g', category: 'Dairy & Eggs' },
      { name: 'Mixed berries', qty: 60, unit: 'g', category: 'Produce' },
      { name: 'Chia seeds', qty: 10, unit: 'g', category: 'Pantry' },
      { name: 'Honey', qty: 10, unit: 'ml', category: 'Pantry' },
    ],
    instructions: 'Layer oats, yogurt, milk and chia in a jar. Refrigerate overnight. Top with berries and honey before eating.',
    prepAhead: 'Make all 5 jars on Sunday evening.',
    notes: '',
  },
  {
    id: uid(), name: 'Swedish Pancakes (Plättar)', vegetarian: true, servings: 2,
    calories: 520, protein: 16, carbs: 60, veggieServings: 0,
    tags: ['weekendBreakfast'],
    ingredients: [
      { name: 'Flour', qty: 200, unit: 'g', category: 'Pantry' },
      { name: 'Eggs', qty: 4, unit: 'pcs', category: 'Dairy & Eggs' },
      { name: 'Milk', qty: 500, unit: 'ml', category: 'Dairy & Eggs' },
      { name: 'Butter', qty: 30, unit: 'g', category: 'Dairy & Eggs' },
      { name: 'Lingonberry jam', qty: 200, unit: 'g', category: 'Pantry' },
    ],
    instructions: 'Whisk flour, eggs, milk and a pinch of salt into a thin batter. Fry in butter until golden. Serve with lingonberry jam.',
    prepAhead: '',
    notes: 'A proper lazy Sunday breakfast.',
  },
  {
    id: uid(), name: 'Red Lentil Daal', vegetarian: true, servings: 4,
    calories: 410, protein: 20, carbs: 55, veggieServings: 2,
    tags: ['mealprepLunch', 'mealprepDinner'],
    ingredients: [
      { name: 'Red lentils', qty: 400, unit: 'g', category: 'Pantry' },
      { name: 'Onion', qty: 2, unit: 'pcs', category: 'Produce' },
      { name: 'Garlic', qty: 4, unit: 'cloves', category: 'Produce' },
      { name: 'Ginger', qty: 1, unit: 'knob', category: 'Produce' },
      { name: 'Chopped tomatoes', qty: 800, unit: 'g', category: 'Pantry' },
      { name: 'Coconut milk', qty: 400, unit: 'ml', category: 'Pantry' },
      { name: 'Spinach', qty: 150, unit: 'g', category: 'Produce' },
      { name: 'Basmati rice', qty: 300, unit: 'g', category: 'Pantry' },
    ],
    instructions: 'Sauté onion, garlic and ginger. Add lentils, tomatoes and spices, simmer 20 min. Stir in coconut milk and spinach at the end. Serve over rice.',
    prepAhead: 'Cook the daal fully and refrigerate — just cook fresh rice each night it is served for dinner.',
    notes: 'Works as both a lunch and a dinner.',
  },
  {
    id: uid(), name: 'Smoky Veggie Chili', vegetarian: true, servings: 4,
    calories: 430, protein: 22, carbs: 50, veggieServings: 2.5,
    tags: ['mealprepLunch', 'mealprepDinner'],
    ingredients: [
      { name: 'Black beans (tin)', qty: 2, unit: 'tins', category: 'Pantry' },
      { name: 'Kidney beans (tin)', qty: 1, unit: 'tin', category: 'Pantry' },
      { name: 'Chopped tomatoes', qty: 800, unit: 'g', category: 'Pantry' },
      { name: 'Bell pepper', qty: 2, unit: 'pcs', category: 'Produce' },
      { name: 'Onion', qty: 1, unit: 'pcs', category: 'Produce' },
      { name: 'Sweetcorn', qty: 200, unit: 'g', category: 'Frozen' },
      { name: 'Smoked paprika & cumin', qty: 1, unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: 'Sauté onion and pepper, add beans, tomatoes, corn and spices. Simmer 25 minutes. Freeze or fridge in portions.',
    prepAhead: 'Make ahead fully — reheats well for lunch, or serve fresh with rice for dinner.',
    notes: '',
  },
  {
    id: uid(), name: 'Halloumi & Sweet Potato Traybake', vegetarian: true, servings: 2,
    calories: 650, protein: 28, carbs: 45, veggieServings: 3,
    tags: ['weekendDinner'],
    ingredients: [
      { name: 'Halloumi', qty: 250, unit: 'g', category: 'Dairy & Eggs' },
      { name: 'Sweet potato', qty: 2, unit: 'pcs', category: 'Produce' },
      { name: 'Red onion', qty: 1, unit: 'pcs', category: 'Produce' },
      { name: 'Courgette', qty: 1, unit: 'pcs', category: 'Produce' },
      { name: 'Cherry tomatoes', qty: 200, unit: 'g', category: 'Produce' },
      { name: 'Honey', qty: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Chili flakes', qty: 1, unit: 'tsp', category: 'Pantry' },
    ],
    instructions: 'Roast the veg 25 min at 200°C, add halloumi slices for the last 10. Drizzle with honey and chili flakes.',
    prepAhead: '',
    notes: 'Weekend indulgence, minimal effort.',
  },
  {
    id: uid(), name: 'Herby Salmon with Roast Veg', vegetarian: false, servings: 2,
    calories: 600, protein: 40, carbs: 30, veggieServings: 2,
    tags: ['weekendDinner'],
    ingredients: [
      { name: 'Salmon fillets', qty: 2, unit: 'pcs', category: 'Protein' },
      { name: 'New potatoes', qty: 400, unit: 'g', category: 'Produce' },
      { name: 'Asparagus', qty: 200, unit: 'g', category: 'Produce' },
      { name: 'Lemon', qty: 1, unit: 'pcs', category: 'Produce' },
      { name: 'Fresh dill', qty: 1, unit: 'bunch', category: 'Produce' },
    ],
    instructions: 'Roast potatoes 20 min, add salmon and asparagus for the final 12–15 min. Finish with lemon and dill.',
    prepAhead: '',
    notes: 'For the weekends you fancy something un-vegetarian.',
  },
  {
    id: uid(), name: 'Crispy Chickpea & Feta Salad', vegetarian: true, servings: 2,
    calories: 420, protein: 16, carbs: 35, veggieServings: 2,
    tags: ['weekendLunch'],
    ingredients: [
      { name: 'Chickpeas (tin)', qty: 1, unit: 'tin', category: 'Pantry' },
      { name: 'Feta', qty: 100, unit: 'g', category: 'Dairy & Eggs' },
      { name: 'Cucumber', qty: 1, unit: 'pcs', category: 'Produce' },
      { name: 'Cherry tomatoes', qty: 150, unit: 'g', category: 'Produce' },
      { name: 'Mixed leaves', qty: 100, unit: 'g', category: 'Produce' },
      { name: 'Olive oil', qty: 2, unit: 'tbsp', category: 'Pantry' },
    ],
    instructions: 'Roast chickpeas until crisp. Toss with leaves, tomatoes, cucumber and feta. Dress with olive oil and lemon.',
    prepAhead: '',
    notes: 'Light — good for a lazy weekend day.',
  },
  {
    id: uid(), name: 'Homemade Spiced Popcorn', vegetarian: true, servings: 4,
    calories: 150, protein: 3, carbs: 20, veggieServings: 0,
    tags: ['weekdaySnack'],
    ingredients: [
      { name: 'Popcorn kernels', qty: 100, unit: 'g', category: 'Pantry' },
      { name: 'Olive oil', qty: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Smoked paprika', qty: 1, unit: 'tsp', category: 'Pantry' },
    ],
    instructions: 'Pop the kernels in oil over medium heat. Toss with paprika and a little salt.',
    prepAhead: '',
    notes: '',
  },
  {
    id: uid(), name: 'Dark Chocolate & Sea Salt Pots', vegetarian: true, servings: 4,
    calories: 280, protein: 5, carbs: 22, veggieServings: 0,
    tags: ['weekendSnack'],
    ingredients: [
      { name: 'Dark chocolate', qty: 150, unit: 'g', category: 'Pantry' },
      { name: 'Double cream', qty: 200, unit: 'ml', category: 'Dairy & Eggs' },
      { name: 'Sea salt', qty: 1, unit: 'pinch', category: 'Pantry' },
    ],
    instructions: 'Melt chocolate with warmed cream, whisk smooth, pour into pots and chill. Finish with sea salt.',
    prepAhead: '',
    notes: 'The indulgent weekend treat.',
  },
];

/* ---------------------------------- storage hook ---------------------------------- */

function useStoredState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch (e) {
      return initial;
    }
  });
  const loaded = true;

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      /* storage full or unavailable — no-op */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state]);

  return [state, setState, loaded];
}

/* ---------------------------------- small ui bits ---------------------------------- */

function Rule({ weight = 1, color = COLORS.oxblood, className = '' }) {
  return <div className={className} style={{ height: weight, background: color }} />;
}

function Star({ size = 24, color = COLORS.oxblood, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
    </svg>
  );
}

function WineGlass({ width = 76, height = 176, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 138" style={style}>
      <defs>
        <filter id="kcWineGlassRough" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="11" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
        </filter>
      </defs>
      <g filter="url(#kcWineGlassRough)" fill="none" stroke={COLORS.ink} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 34 Q30 38 52 34 C54 47 48 58 40 66 C36 70 33 72 30 73 C27 72 24 70 20 66 C12 58 6 47 8 34 Z" fill={COLORS.ink} />
        <path d="M10 14 C14 8 46 8 50 14 C46 20 14 20 10 14 Z" />
        <path d="M10 14 C6 34 8 52 16 62 C22 70 26 72 30 73 C34 72 38 70 44 62 C52 52 54 34 50 14" />
        <path d="M29 73 C28 92 28 108 29 123" />
        <path d="M14 126 C20 122 40 122 46 126 C40 130 20 130 14 126 Z" fill={COLORS.ink} />
      </g>
    </svg>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mb-6">
      <h2 style={{ fontFamily: FONT_SCRIPT, color: COLORS.oxblood, textTransform: 'uppercase' }} className="text-4xl leading-none mb-3">
        {children}
      </h2>
      <Rule weight={2} />
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-1.5 transition"
      style={{
        fontFamily: FONT_STAMP,
        fontSize: 12,
        letterSpacing: '0.04em',
        color: checked ? COLORS.forest : COLORS.inkSoft,
      }}
    >
      <span
        style={{
          width: 13, height: 13, borderRadius: 3, display: 'inline-block',
          border: `1.5px solid ${checked ? COLORS.forest : COLORS.inkSoft}`,
          background: checked ? COLORS.forest : 'transparent',
        }}
      />
      {label.toUpperCase()}
    </button>
  );
}

/* ---------------------------------- recipe form modal ---------------------------------- */

function emptyRecipe(presetTag, vegetarian) {
  return {
    id: uid(), name: '', vegetarian: vegetarian ?? true, servings: 1,
    calories: '', protein: '', carbs: '', veggieServings: '',
    tags: presetTag ? [presetTag] : [],
    ingredients: [{ name: '', qty: '', unit: '', category: 'Produce' }],
    instructions: '', prepAhead: '', notes: '', image: null,
  };
}

function RecipeFormModal({ initial, onClose, onSave }) {
  const [r, setR] = useState(initial);
  const [photoError, setPhotoError] = useState(null);

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setR(prev => ({ ...prev, image: dataUrl }));
    } catch (err) {
      setPhotoError("Couldn't load that image — try a different file.");
    }
  }

  function setField(field, value) { setR(prev => ({ ...prev, [field]: value })); }
  function toggleTag(tagKey) {
    setR(prev => ({
      ...prev,
      tags: prev.tags.includes(tagKey) ? prev.tags.filter(t => t !== tagKey) : [...prev.tags, tagKey],
    }));
  }
  function updateIngredient(idx, field, value) {
    setR(prev => {
      const next = [...prev.ingredients];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, ingredients: next };
    });
  }
  function addIngredientRow() {
    setR(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: '', qty: '', unit: '', category: 'Produce' }] }));
  }
  function removeIngredientRow(idx) {
    setR(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== idx) }));
  }

  function handleSave() {
    if (!r.name.trim()) return;
    const cleaned = {
      ...r,
      servings: parseFloat(r.servings) || 1,
      calories: parseFloat(r.calories) || 0,
      protein: parseFloat(r.protein) || 0,
      carbs: parseFloat(r.carbs) || 0,
      veggieServings: parseFloat(r.veggieServings) || 0,
      ingredients: r.ingredients.filter(i => i.name.trim()).map(i => ({ ...i, qty: parseFloat(i.qty) || 0 })),
    };
    onSave(cleaned);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(20,14,8,0.55)' }}>
      <div
        className="w-full max-w-2xl rounded-lg shadow-2xl overflow-y-auto"
        style={{ background: COLORS.card, maxHeight: '90vh', border: `2px solid ${COLORS.cardEdge}` }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `2px solid ${COLORS.cardEdge}` }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 800 }} className="text-xl">
            {initial.name ? 'Edit Recipe' : 'New Recipe Card'}
          </h3>
          <button onClick={onClose}><X size={20} color={COLORS.inkSoft} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3">
            {r.image ? (
              <img src={r.image} alt="" className="w-16 h-16 object-cover rounded" style={{ border: `1px solid ${COLORS.cardEdge}` }} />
            ) : (
              <div className="w-16 h-16 rounded flex items-center justify-center" style={{ background: COLORS.paperDark }}>
                <ImageIcon size={20} color={COLORS.forest} />
              </div>
            )}
            <div>
              <label className="px-3 py-1.5 rounded text-xs cursor-pointer inline-block" style={{ fontFamily: FONT_BODY, border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }}>
                {r.image ? 'Change photo' : 'Add a photo'}
                <input type="file" accept="image/*" onChange={handlePhotoPick} className="hidden" />
              </label>
              {r.image && (
                <button onClick={() => setField('image', null)} className="text-xs ml-2" style={{ fontFamily: FONT_BODY, color: COLORS.oxblood }}>Remove</button>
              )}
              {photoError && <p className="text-xs mt-1" style={{ fontFamily: FONT_BODY, color: COLORS.oxblood }}>{photoError}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>RECIPE NAME</label>
            <input
              value={r.name} onChange={e => setField('name', e.target.value)}
              placeholder="e.g. Red Lentil Daal"
              className="w-full px-3 py-2 rounded"
              style={{ fontFamily: FONT_BODY, border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <NumField label="Servings" value={r.servings} onChange={v => setField('servings', v)} />
            <NumField label="Calories/serv" value={r.calories} onChange={v => setField('calories', v)} />
            <NumField label="Protein (g)" value={r.protein} onChange={v => setField('protein', v)} />
            <NumField label="Carbs (g)" value={r.carbs} onChange={v => setField('carbs', v)} />
            <NumField label="Veggie servings" value={r.veggieServings} onChange={v => setField('veggieServings', v)} />
          </div>

          <div className="flex items-center gap-3">
            <Toggle checked={r.vegetarian} onChange={v => setField('vegetarian', v)} label="Vegetarian" />
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>TAGS — where does this belong? (pick any that fit)</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(t => (
                <button
                  key={t.key}
                  onClick={() => toggleTag(t.key)}
                  className="px-3 py-1 rounded-md text-xs border-0"
                  style={{
                    fontFamily: FONT_BODY,
                    background: r.tags.includes(t.key) ? COLORS.forest : COLORS.paperDark,
                    color: r.tags.includes(t.key) ? COLORS.cream : COLORS.forest,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>INGREDIENTS</label>
            <div className="space-y-2">
              {r.ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input placeholder="ingredient" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }} />
                  <input placeholder="qty" type="number" value={ing.qty} onChange={e => updateIngredient(idx, 'qty', e.target.value)}
                    className="w-16 px-2 py-1.5 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }} />
                  <input placeholder="unit" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                    className="w-16 px-2 py-1.5 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }} />
                  <select value={ing.category} onChange={e => updateIngredient(idx, 'category', e.target.value)}
                    className="w-32 px-2 py-1.5 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => removeIngredientRow(idx)}><X size={16} color={COLORS.oxblood} /></button>
                </div>
              ))}
              <button onClick={addIngredientRow} className="text-xs flex items-center gap-1" style={{ color: COLORS.forest, fontFamily: FONT_STAMP }}>
                <Plus size={14} /> add ingredient
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>INSTRUCTIONS</label>
            <textarea value={r.instructions} onChange={e => setField('instructions', e.target.value)} rows={4}
              className="w-full px-3 py-2 rounded text-sm" style={{ fontFamily: FONT_BODY, border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>MAKE-AHEAD NOTES (optional)</label>
            <input value={r.prepAhead} onChange={e => setField('prepAhead', e.target.value)} placeholder="e.g. cook base ahead, cook rice fresh"
              className="w-full px-3 py-2 rounded text-sm" style={{ fontFamily: FONT_BODY, border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: `2px solid ${COLORS.cardEdge}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded text-sm"
            style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>Save Recipe</button>
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }} />
    </div>
  );
}

/* ---------------------------------- recipe card ---------------------------------- */

function eligibleSlots(recipe) {
  const out = [];
  ['weekday', 'weekend'].forEach(shopType => {
    SLOT_DEFS[shopType].forEach(def => {
      if (recipe.tags.includes(def.tag)) out.push({ shopType, slotId: def.id, label: `${shopType === 'weekday' ? 'Weekday' : 'Weekend'} — ${def.label}` });
    });
  });
  return out;
}

function categoriesForRecipe(recipe) {
  const joined = recipe.tags.join(' ').toLowerCase();
  const cats = [];
  if (joined.includes('breakfast')) cats.push('Breakfast');
  if (joined.includes('lunch')) cats.push('Lunch');
  if (joined.includes('dinner')) cats.push('Dinner');
  if (joined.includes('snack')) cats.push('Snacks');
  if (cats.length === 0) cats.push('Other');
  return cats;
}

function RecipeCard({ recipe, onEdit, onDelete, onSendToPlan }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sentLabel, setSentLabel] = useState(null);
  const slots = eligibleSlots(recipe);

  function handleSend(slot) {
    onSendToPlan(recipe.id, slot.shopType, slot.slotId);
    setSentLabel(slot.label);
    setMenuOpen(false);
    setTimeout(() => setSentLabel(null), 2200);
  }

  return (
    <div
      className="rounded-xl overflow-hidden w-full mb-5"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.cardEdge}`, boxShadow: '0 3px 12px rgba(20,20,20,0.08)', breakInside: 'avoid', display: 'inline-block' }}
    >
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.name} className="w-full object-cover" style={{ height: 140 }} />
      ) : (
        <div className="w-full flex items-center justify-center" style={{ height: 100, background: COLORS.paperDark }}>
          <Star size={26} color={COLORS.forest} style={{ transform: 'rotate(-8deg)' }} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700 }} className="text-lg leading-tight">
            {recipe.name}
          </h4>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <button onClick={() => onEdit(recipe)} className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>EDIT</button>
            <button onClick={() => onDelete(recipe.id)} className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>DELETE</button>
          </div>
        </div>

        <p className="mb-2" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft, letterSpacing: '0.03em', fontSize: 11 }}>
          {recipe.vegetarian && <span style={{ color: COLORS.forest, fontWeight: 600 }}>VEG · </span>}
          {recipe.tags.map(t => TAG_LABEL[t]?.toUpperCase()).join(' · ')}
        </p>

        <p className="mb-2" style={{ fontFamily: FONT_MONO, color: COLORS.ink, fontSize: 12 }}>
          {recipe.calories} kcal · {recipe.protein}g protein · serves {recipe.servings}
        </p>

        {recipe.prepAhead && (
          <div className="flex items-start gap-1 text-xs mb-2" style={{ color: COLORS.forest, fontFamily: FONT_BODY }}>
            <Clock size={12} className="mt-0.5 shrink-0" />
            <span>{recipe.prepAhead}</span>
          </div>
        )}

        <details className="mb-3">
          <summary className="text-xs cursor-pointer" style={{ fontFamily: FONT_STAMP, color: COLORS.forest }}>
            ingredients &amp; method
          </summary>
          <div className="mt-2 text-sm" style={{ color: COLORS.ink }}>
            <ul className="mb-2" style={{ fontFamily: FONT_MONO, fontSize: 13, listStyle: 'none', padding: 0 }}>
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{ing.qty ? `${ing.qty} ${ing.unit} ` : ''}{ing.name}</li>
              ))}
            </ul>
            <p style={{ fontFamily: FONT_BODY }}>{recipe.instructions}</p>
          </div>
        </details>

        <div className="relative" style={{ borderTop: `1px solid ${COLORS.cardEdge}`, paddingTop: 10 }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            disabled={slots.length === 0}
            className="w-full text-xs font-bold disabled:opacity-40"
            style={{ fontFamily: FONT_STAMP, color: COLORS.oxblood, letterSpacing: '0.03em' }}
          >
            {sentLabel ? `ADDED → ${sentLabel.toUpperCase()}` : 'PLAN FOR THIS WEEK →'}
          </button>

          {menuOpen && (
            <div className="absolute left-0 right-0 mt-1 rounded-lg shadow-lg z-20 overflow-hidden"
              style={{ background: COLORS.cream, border: `1px solid ${COLORS.cardEdge}` }}>
              {slots.map(s => (
                <button key={s.shopType + s.slotId} onClick={() => handleSend(s)}
                  className="w-full text-left px-3 py-2 text-xs hover:opacity-80"
                  style={{ fontFamily: FONT_BODY, color: COLORS.ink, borderBottom: `1px solid ${COLORS.cardEdge}` }}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- bank tab ---------------------------------- */

const GALLERY_CATEGORY_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Other'];

function RecipeGallery({ recipes, vegOnly, onEdit, onDelete, onSendToPlan }) {
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState([]);

  function toggleFilterTag(tagKey) {
    setActiveTags(prev => prev.includes(tagKey) ? prev.filter(t => t !== tagKey) : [...prev, tagKey]);
  }

  const filtered = recipes.filter(r => {
    if (vegOnly && !r.vegetarian) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTags.length && !activeTags.some(t => r.tags.includes(t))) return false;
    return true;
  });

  const groups = {};
  filtered.forEach(r => {
    categoriesForRecipe(r).forEach(cat => {
      (groups[cat] = groups[cat] || []).push(r);
    });
  });

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)} placeholder="search recipes…"
          className="px-1 py-1.5 text-sm bg-transparent focus:outline-none"
          style={{ borderBottom: `1px solid ${COLORS.ink}`, fontFamily: FONT_BODY, color: COLORS.ink }}
        />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-8">
        {TAGS.map(t => (
          <button key={t.key} onClick={() => toggleFilterTag(t.key)}
            className="text-xs"
            style={{
              fontFamily: FONT_STAMP,
              letterSpacing: '0.03em',
              color: activeTags.includes(t.key) ? COLORS.oxblood : COLORS.inkSoft,
              fontWeight: activeTags.includes(t.key) ? 600 : 400,
              borderBottom: activeTags.includes(t.key) ? `1px solid ${COLORS.oxblood}` : '1px solid transparent',
            }}>
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY }}>No recipes match yet — add one, or loosen your filters.</p>
      ) : (
        GALLERY_CATEGORY_ORDER.map(cat => groups[cat] && groups[cat].length > 0 && (
          <div key={cat} className="mb-10">
            <h3 style={{ fontFamily: FONT_SCRIPT, color: COLORS.oxblood, textTransform: 'uppercase' }} className="text-3xl leading-none mb-2">{cat}</h3>
            <Rule weight={2} className="mb-4" />
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
              {groups[cat].map(r => (
                <RecipeCard key={r.id} recipe={r} onEdit={onEdit} onDelete={onDelete} onSendToPlan={onSendToPlan} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function BankTab({ recipes, onAdd, onEdit, onDelete, onSendToPlan, vegOnly, setVegOnly }) {
  return (
    <div>
      <SectionTitle>The Recipe Bank</SectionTitle>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Toggle checked={vegOnly} onChange={setVegOnly} label="Vegetarian" />
        <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
          style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
          <Plus size={15} /> Add Recipe
        </button>
      </div>

      <RecipeGallery recipes={recipes} vegOnly={vegOnly} onEdit={onEdit} onDelete={onDelete} onSendToPlan={onSendToPlan} />
    </div>
  );
}

/* ---------------------------------- to try tab ---------------------------------- */

function ToTryTab({ toTry, setToTry, onPromote }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  function addEntry() {
    if (!text.trim()) return;
    setToTry(prev => [{ id: uid(), title: title.trim() || 'Untitled clipping', text: text.trim() }, ...prev]);
    setTitle(''); setText('');
  }
  function removeEntry(id) { setToTry(prev => prev.filter(e => e.id !== id)); }

  return (
    <div>
      <SectionTitle>Recipes to Try</SectionTitle>
      <p className="text-sm mb-6" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
        A scrap drawer for recipes you've spotted but haven't cooked yet. Paste them in, and promote the good ones to the Bank once you've tried them.
      </p>

      <div className="mb-10 pb-6" style={{ borderBottom: `1px solid ${COLORS.cardEdge}` }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g. Mum's Focaccia idea)"
          className="w-full px-1 py-1.5 text-sm mb-3 bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_BODY }} />
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Paste the recipe, a link, or your notes here…"
          className="w-full px-1 py-1.5 text-sm mb-3 bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_BODY }} />
        <button onClick={addEntry} className="px-4 py-2 rounded-full text-sm" style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
          Save Clipping
        </button>
      </div>

      <div>
        {toTry.length === 0 && <p className="text-sm" style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY }}>Nothing saved yet.</p>}
        {toTry.map(entry => (
          <div key={entry.id} className="py-4" style={{ borderBottom: `1px solid ${COLORS.cardEdge}` }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink }} className="text-lg font-bold">{entry.title}</h4>
              <div className="flex items-center gap-4 shrink-0">
                <button onClick={() => onPromote(entry)} className="text-xs font-semibold" style={{ fontFamily: FONT_STAMP, color: COLORS.orange }}>
                  PROMOTE TO BANK →
                </button>
                <button onClick={() => removeEntry(entry.id)} className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>DELETE</button>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>{entry.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- plan tab ---------------------------------- */

function PlanTab({ recipes, settings, setSettings, mealPlan, setMealPlan, onEdit, onDelete, onSendToPlan, onAdd, pantry, onUsePlanIngredients }) {
  const shopType = settings.shopType;
  const defs = SLOT_DEFS[shopType];
  const planForShop = mealPlan[shopType] || {};
  const [usedMessage, setUsedMessage] = useState(null);

  function setSlot(slotId, field, value) {
    setMealPlan(prev => ({
      ...prev,
      [shopType]: {
        ...prev[shopType],
        [slotId]: { ...(prev[shopType]?.[slotId] || {}), [field]: value },
      },
    }));
  }

  function recipeUsesPantry(recipe) {
    return (recipe.ingredients || []).some(ing => (pantry[pantryKey(ing.name, ing.unit)]?.qty || 0) > 0);
  }

  function generateSuggestions() {
    const used = new Set();
    const newSlots = {};
    defs.forEach(def => {
      const pool = recipes.filter(r => r.tags.includes(def.tag) && (!settings.vegOnly || r.vegetarian));
      const fresh = pool.filter(r => !used.has(r.id));
      let choices = fresh.length ? fresh : pool;
      const pantryFirst = choices.filter(recipeUsesPantry);
      if (pantryFirst.length) choices = pantryFirst;
      if (!choices.length) {
        newSlots[def.id] = { recipeId: null, times: planForShop[def.id]?.times ?? def.defaultTimes };
        return;
      }
      const pick = choices[Math.floor(Math.random() * choices.length)];
      used.add(pick.id);
      newSlots[def.id] = { recipeId: pick.id, times: planForShop[def.id]?.times ?? def.defaultTimes };
    });
    setMealPlan(prev => ({ ...prev, [shopType]: newSlots }));
  }

  function clearPlan() {
    setMealPlan(prev => ({ ...prev, [shopType]: {} }));
  }

  function handleUseIngredients() {
    onUsePlanIngredients(shopType);
    setUsedMessage('Pantry updated for this plan.');
    setTimeout(() => setUsedMessage(null), 2500);
  }

  const nutrition = useMemo(() => {
    let cal = 0, protein = 0, carbs = 0, veggie = 0;
    defs.forEach(def => {
      const slot = planForShop[def.id];
      if (!slot || !slot.recipeId) return;
      const r = recipes.find(x => x.id === slot.recipeId);
      if (!r) return;
      const times = slot.times ?? def.defaultTimes;
      cal += (r.calories || 0) * times;
      protein += (r.protein || 0) * times;
      carbs += (r.carbs || 0) * times;
      veggie += (r.veggieServings || 0) * times;
    });
    return { cal, protein, carbs, veggie };
  }, [planForShop, recipes, defs]);

  const days = shopType === 'weekday' ? 5 : 2;
  const goal = settings.veggieGoal || 14;
  const goalForPeriod = shopType === 'weekday' ? goal * (5 / 7) : goal * (2 / 7);

  return (
    <div>
      <SectionTitle>The Meal Plan</SectionTitle>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8">
        <div className="flex items-center gap-4">
          {['weekday', 'weekend'].map(st => (
            <button key={st} onClick={() => setSettings(prev => ({ ...prev, shopType: st }))}
              className="text-sm pb-0.5"
              style={{
                fontFamily: FONT_STAMP,
                letterSpacing: '0.04em',
                fontWeight: shopType === st ? 600 : 400,
                color: shopType === st ? COLORS.oxblood : COLORS.inkSoft,
                borderBottom: shopType === st ? `2px solid ${COLORS.oxblood}` : '2px solid transparent',
              }}>
              {st === 'weekday' ? 'WEEKDAY SHOP' : 'WEEKEND SHOP'}
            </button>
          ))}
        </div>
        <Toggle checked={settings.vegOnly} onChange={v => setSettings(prev => ({ ...prev, vegOnly: v }))} label="Vegetarian" />
        <button onClick={generateSuggestions} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm"
          style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
          <Shuffle size={14} /> Generate
        </button>
        <button onClick={handleUseIngredients} className="text-xs font-semibold" style={{ fontFamily: FONT_STAMP, color: COLORS.forest }}>
          Use ingredients
        </button>
        <button onClick={clearPlan} className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>Clear</button>
        {usedMessage && <span className="text-xs" style={{ fontFamily: FONT_BODY, color: COLORS.forest }}>{usedMessage}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <div className="lg:col-span-2">
          {defs.map(def => {
            const slot = planForShop[def.id] || {};
            const times = slot.times ?? def.defaultTimes;
            const chosen = recipes.find(r => r.id === slot.recipeId);
            return (
              <div key={def.id} className="py-4" style={{ borderBottom: `1px solid ${COLORS.cardEdge}` }}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span style={{ fontFamily: FONT_STAMP, color: COLORS.oxblood, fontSize: 12, letterSpacing: '0.05em', fontWeight: 600 }}>{def.label.toUpperCase()}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>× per week</label>
                    <input type="number" min={0} value={times} onChange={e => setSlot(def.id, 'times', parseFloat(e.target.value) || 0)}
                      className="w-12 text-center text-sm bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}` }} />
                  </div>
                </div>

                {chosen ? (
                  <div className="flex items-center gap-3">
                    {chosen.image && <img src={chosen.image} alt="" className="w-12 h-12 object-cover shrink-0" style={{ borderRadius: 3 }} />}
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700 }} className="text-base truncate">{chosen.name}</p>
                      <p style={{ fontFamily: FONT_MONO, color: COLORS.inkSoft, fontSize: 12 }}>{chosen.calories} kcal · {chosen.protein}g protein</p>
                      {chosen.prepAhead && (
                        <div className="flex items-start gap-1 text-xs mt-1" style={{ color: COLORS.mustard, fontFamily: FONT_BODY }}>
                          <Clock size={12} className="mt-0.5 shrink-0" /> <span>{chosen.prepAhead}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setSlot(def.id, 'recipeId', null)} className="shrink-0" title="Clear"><X size={16} color={COLORS.inkSoft} /></button>
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
                    Not planned yet — pick one from the gallery below.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="h-fit" style={{ background: COLORS.paperDark, borderTop: `3px solid ${COLORS.oxblood}` }}>
          <div className="p-5">
            <h3 style={{ fontFamily: FONT_SCRIPT, color: COLORS.oxblood, textTransform: 'uppercase' }} className="text-2xl leading-none mb-3">
              Nutrition — {shopType === 'weekday' ? 'work week' : 'weekend'}
            </h3>
            <div className="space-y-3 text-sm" style={{ fontFamily: FONT_MONO, color: COLORS.ink }}>
              <StatRow label="Total calories" value={`${Math.round(nutrition.cal)} kcal`} sub={`~${Math.round(nutrition.cal / days)}/day`} />
              <StatRow label="Protein" value={`${round1(nutrition.protein)} g`} sub={`~${round1(nutrition.protein / days)}/day`} />
              <StatRow label="Carbs" value={`${round1(nutrition.carbs)} g`} sub={`~${round1(nutrition.carbs / days)}/day`} />
              <div>
                <div className="flex justify-between">
                  <span>Veggie servings</span>
                  <span className="font-bold">{round1(nutrition.veggie)} / {round1(goalForPeriod)}</span>
                </div>
                <div className="w-full h-1.5 mt-1" style={{ background: COLORS.cardEdge }}>
                  <div className="h-1.5" style={{
                    width: `${Math.min(100, (nutrition.veggie / goalForPeriod) * 100)}%`,
                    background: COLORS.orange,
                  }} />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${COLORS.cardEdge}` }}>
              <label className="block text-xs mb-1" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>WEEKLY VEGGIE GOAL (servings)</label>
              <input type="number" value={settings.veggieGoal} onChange={e => setSettings(prev => ({ ...prev, veggieGoal: parseFloat(e.target.value) || 0 }))}
                className="w-20 text-sm bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_MONO }} />
            </div>
            <p className="text-xs mt-3" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
              A loose guide, not a strict count — enough to sense-check the week.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <h3 style={{ fontFamily: FONT_SCRIPT, color: COLORS.oxblood, textTransform: 'uppercase' }} className="text-4xl leading-none mb-1">Recipe Gallery</h3>
            <p className="text-sm" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
              Scroll through the bank and tap "Plan for this week" to slot a recipe straight in.
            </p>
          </div>
          <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm shrink-0"
            style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
            <Plus size={15} /> Add Recipe
          </button>
        </div>
        <Rule weight={2} />
        <div className="mt-6">
          <RecipeGallery recipes={recipes} vegOnly={settings.vegOnly} onEdit={onEdit} onDelete={onDelete} onSendToPlan={onSendToPlan} />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between">
      <span>{label}</span>
      <span><span className="font-bold">{value}</span> <span className="text-xs" style={{ color: COLORS.inkSoft }}>({sub})</span></span>
    </div>
  );
}

/* ---------------------------------- pantry tab ---------------------------------- */

function PantryRow({ item, onRename, onUpdateQty, onUpdateCategory, onRemove }) {
  const [localName, setLocalName] = useState(item.name);
  const [localUnit, setLocalUnit] = useState(item.unit);

  useEffect(() => { setLocalName(item.name); }, [item.name]);
  useEffect(() => { setLocalUnit(item.unit); }, [item.unit]);

  function commitRename() {
    const trimmedName = localName.trim() || item.name;
    const trimmedUnit = localUnit.trim();
    if (trimmedName !== item.name || trimmedUnit !== item.unit) onRename(trimmedName, trimmedUnit);
  }

  return (
    <li className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${COLORS.cardEdge}` }}>
      <input value={localName} onChange={e => setLocalName(e.target.value)} onBlur={commitRename}
        className="flex-1 text-sm bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_MONO, color: COLORS.ink }} />
      <input type="number" value={item.qty} onChange={e => onUpdateQty(e.target.value)}
        className="w-16 text-right text-sm bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_MONO }} />
      <input value={localUnit} onChange={e => setLocalUnit(e.target.value)} onBlur={commitRename} placeholder="unit"
        className="w-14 text-xs bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_STAMP, color: COLORS.inkSoft }} />
      <select value={item.category} onChange={e => onUpdateCategory(e.target.value)}
        className="text-xs bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button onClick={onRemove} className="text-xs shrink-0" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>DELETE</button>
    </li>
  );
}

function PantryTab({ pantry, setPantry }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('Produce');

  const items = Object.values(pantry).sort((a, b) => a.name.localeCompare(b.name));
  const grouped = {};
  items.forEach(i => { (grouped[i.category] = grouped[i.category] || []).push(i); });

  function addItem() {
    if (!name.trim()) return;
    const key = pantryKey(name, unit);
    setPantry(prev => {
      const existing = prev[key];
      const newQty = round1((existing?.qty || 0) + (parseFloat(qty) || 0));
      return { ...prev, [key]: { name: name.trim(), unit: unit.trim(), category, qty: newQty } };
    });
    setName(''); setQty(''); setUnit('');
  }

  function updateQty(key, newQty) {
    setPantry(prev => ({ ...prev, [key]: { ...prev[key], qty: Math.max(0, parseFloat(newQty) || 0) } }));
  }

  function updateCategory(key, newCategory) {
    setPantry(prev => ({ ...prev, [key]: { ...prev[key], category: newCategory } }));
  }

  function renameItem(oldKey, newName, newUnit) {
    const newKey = pantryKey(newName, newUnit);
    setPantry(prev => {
      const item = prev[oldKey];
      if (!item) return prev;
      if (newKey === oldKey) return { ...prev, [oldKey]: { ...item, name: newName, unit: newUnit } };
      const next = { ...prev };
      delete next[oldKey];
      const mergedQty = round1((next[newKey]?.qty || 0) + item.qty);
      next[newKey] = { name: newName, unit: newUnit, category: item.category, qty: mergedQty };
      return next;
    });
  }

  function removeItem(key) {
    setPantry(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  return (
    <div>
      <SectionTitle>Pantry</SectionTitle>
      <p className="text-sm mb-6" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
        What you've got on hand. This fills in automatically when you check off a purchase on the Shopping List, and empties out when you use "Use ingredients" on the Meal Plan tab — or edit anything below by hand, any time.
      </p>

      <div className="mb-10 pb-6" style={{ borderBottom: `1px solid ${COLORS.cardEdge}` }}>
        <p className="text-xs mb-2" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft, letterSpacing: '0.04em' }}>ADD SOMETHING MANUALLY</p>
        <div className="flex flex-wrap gap-2 items-center">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="item"
            className="px-2 py-1.5 text-sm bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_BODY, width: 160 }} />
          <input value={qty} onChange={e => setQty(e.target.value)} type="number" placeholder="qty"
            className="px-2 py-1.5 text-sm bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_BODY, width: 70 }} />
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unit"
            className="px-2 py-1.5 text-sm bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_BODY, width: 70 }} />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="px-2 py-1.5 text-sm bg-transparent focus:outline-none" style={{ borderBottom: `1px solid ${COLORS.cardEdge}`, fontFamily: FONT_BODY }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addItem} className="px-4 py-1.5 rounded-full text-sm" style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
            Add
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
          Nothing tracked yet — check something off on the Shopping List, or add an item above.
        </p>
      ) : (
        CATEGORIES.map(cat => grouped[cat] && grouped[cat].length > 0 && (
          <div key={cat} className="mb-8">
            <h4 style={{ fontFamily: FONT_SCRIPT, color: COLORS.oxblood, textTransform: 'uppercase' }} className="text-2xl leading-none mb-2">{cat}</h4>
            <Rule weight={2} className="mb-3" />
            <ul>
              {grouped[cat].map(item => {
                const key = pantryKey(item.name, item.unit);
                return (
                  <PantryRow
                    key={key}
                    item={item}
                    onRename={(newName, newUnit) => renameItem(key, newName, newUnit)}
                    onUpdateQty={newQty => updateQty(key, newQty)}
                    onUpdateCategory={newCategory => updateCategory(key, newCategory)}
                    onRemove={() => removeItem(key)}
                  />
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------------------------- shopping list tab ---------------------------------- */

function PurchaseModal({ item, onClose, onConfirm }) {
  const [qty, setQty] = useState(item.toBuy || item.qty || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(20,14,8,0.55)' }}>
      <div className="w-full max-w-sm rounded-lg shadow-2xl p-6" style={{ background: COLORS.card, border: `1px solid ${COLORS.cardEdge}` }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700 }} className="text-lg mb-1">{item.name}</h3>
        <p className="text-xs mb-4" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>How much did you buy?</p>
        <div className="flex items-center gap-2 mb-5">
          <input type="number" autoFocus value={qty} onChange={e => setQty(e.target.value)}
            className="flex-1 px-3 py-2 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream, fontFamily: FONT_MONO }} />
          <span className="text-sm" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>{item.unit}</span>
        </div>
        <button onClick={() => onConfirm(0, true)} className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>
          Just check it off — don't track pantry
        </button>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>Cancel</button>
          <button onClick={() => onConfirm(parseFloat(qty) || 0, true)} className="px-4 py-2 rounded-full text-sm"
            style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
            Add to pantry
          </button>
        </div>
      </div>
    </div>
  );
}

function ListTab({ recipes, settings, mealPlan, checkedItems, setCheckedItems, pantry, onLogPurchase }) {
  const shopType = settings.shopType;
  const defs = SLOT_DEFS[shopType];
  const planForShop = mealPlan[shopType] || {};
  const [copied, setCopied] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState(null);

  const list = useMemo(() => {
    const map = {};
    defs.forEach(def => {
      const slot = planForShop[def.id];
      if (!slot || !slot.recipeId) return;
      const r = recipes.find(x => x.id === slot.recipeId);
      if (!r) return;
      const times = slot.times ?? def.defaultTimes;
      const servings = r.servings || 1;
      const factor = times / servings;
      (r.ingredients || []).forEach(ing => {
        const key = pantryKey(ing.name, ing.unit);
        if (!map[key]) map[key] = { key, name: ing.name, unit: ing.unit, category: ing.category || 'Other', qty: 0, from: new Set() };
        map[key].qty += (parseFloat(ing.qty) || 0) * factor;
        map[key].from.add(r.name);
      });
    });
    return Object.values(map).map(i => {
      const onHand = pantry[i.key]?.qty || 0;
      return { ...i, qty: round1(i.qty), from: [...i.from], onHand: round1(onHand), toBuy: round1(Math.max(0, i.qty - onHand)) };
    });
  }, [recipes, planForShop, defs, pantry]);

  const toBuyList = list.filter(i => i.toBuy > 0);
  const haveEnoughList = list.filter(i => i.toBuy <= 0);

  const grouped = {};
  toBuyList.forEach(i => { (grouped[i.category] = grouped[i.category] || []).push(i); });

  function checkKey(itemKey) { return `${shopType}:${itemKey}`; }
  function isChecked(itemKey) { return !!checkedItems[checkKey(itemKey)]; }
  function toggleChecked(itemKey, value) {
    setCheckedItems(prev => ({ ...prev, [checkKey(itemKey)]: value ?? !prev[checkKey(itemKey)] }));
  }

  function handleBoxClick(item) {
    if (isChecked(item.key)) { toggleChecked(item.key, false); return; }
    setPurchaseItem(item);
  }

  function confirmPurchase(qtyBought, checkOff) {
    if (qtyBought > 0) onLogPurchase(purchaseItem, qtyBought);
    if (checkOff) toggleChecked(purchaseItem.key, true);
    setPurchaseItem(null);
  }

  function buildText() {
    let text = `🧺 ${shopType === 'weekday' ? 'Weekday' : 'Weekend'} Shopping List\n\n`;
    CATEGORIES.forEach(cat => {
      const items = (grouped[cat] || []).filter(i => !isChecked(i.key));
      if (!items.length) return;
      text += `${cat.toUpperCase()}\n`;
      items.forEach(i => {
        text += `☐ ${i.name}${i.toBuy ? ` — ${i.toBuy}${i.unit ? ' ' + i.unit : ''}` : ''}\n`;
      });
      text += '\n';
    });
    return text;
  }

  async function share() {
    const text = buildText();
    if (navigator.share) {
      try { await navigator.share({ title: 'Shopping List', text }); return; } catch (e) { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* no-op */ }
  }

  return (
    <div>
      <SectionTitle>Shopping List — {shopType === 'weekday' ? 'Weekday' : 'Weekend'} Shop</SectionTitle>

      {list.length === 0 ? (
        <p className="text-sm" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
          No meals planned for this shop yet — fill out the Meal Plan tab first.
        </p>
      ) : (
        <>
          <div className="flex gap-3 mb-5">
            <button onClick={share} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
              style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
              <Share2 size={15} /> Share to phone
            </button>
            <button onClick={() => { navigator.clipboard?.writeText(buildText()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
              style={{ fontFamily: FONT_STAMP, border: `1.5px solid ${COLORS.oxblood}`, color: COLORS.oxblood }}>
              <Copy size={15} /> Copy text
            </button>
            {copied && <span className="text-sm self-center" style={{ color: COLORS.forest, fontFamily: FONT_BODY }}>Copied!</span>}
          </div>
          <p className="text-xs mb-5" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
            Tap an item to log how much you bought — it's added to your Pantry and left out of the list next time. Amounts already shown here have your pantry stock subtracted.
          </p>

          {toBuyList.length === 0 ? (
            <p className="text-sm mb-8" style={{ fontFamily: FONT_BODY, color: COLORS.forest }}>
              You've already got everything this plan needs — nothing left to buy.
            </p>
          ) : (
            <div className="max-w-xl" style={{ borderTop: `3px solid ${COLORS.oxblood}`, borderBottom: `1px solid ${COLORS.cardEdge}` }}>
              <div className="py-6">
                {CATEGORIES.map(cat => (
                  grouped[cat] && grouped[cat].length > 0 && (
                    <div key={cat} className="mb-6">
                      <h4 style={{ fontFamily: FONT_SCRIPT, color: COLORS.oxblood, textTransform: 'uppercase' }} className="text-2xl leading-none mb-2">{cat}</h4>
                      <ul className="space-y-1.5">
                        {grouped[cat].map((i) => {
                          const checked = isChecked(i.key);
                          return (
                            <li key={i.key}>
                              <button
                                onClick={() => handleBoxClick(i)}
                                className="flex items-center gap-2.5 text-sm w-full text-left"
                                style={{ fontFamily: FONT_MONO, color: checked ? COLORS.inkSoft : COLORS.ink, opacity: checked ? 0.55 : 1 }}
                              >
                                <span style={{
                                  width: 13, height: 13, border: `1.5px solid ${checked ? COLORS.forest : COLORS.inkSoft}`,
                                  background: checked ? COLORS.forest : 'transparent',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                  {checked && <span style={{ width: 7, height: 7, background: COLORS.cream }} />}
                                </span>
                                <span style={{ textDecoration: checked ? 'line-through' : 'none' }}>
                                  {i.name}{i.toBuy ? ` — ${i.toBuy}${i.unit ? ' ' + i.unit : ''}` : ''}
                                  {i.onHand > 0 && <span style={{ color: COLORS.forest }}> (have {i.onHand}{i.unit})</span>}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {haveEnoughList.length > 0 && (
            <div className="mt-8">
              <p className="text-xs mb-2" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft, letterSpacing: '0.04em' }}>
                ALREADY IN YOUR PANTRY — not on the list
              </p>
              <ul className="text-xs" style={{ fontFamily: FONT_MONO, color: COLORS.inkSoft }}>
                {haveEnoughList.map(i => (
                  <li key={i.key}>{i.name} — have {i.onHand}{i.unit}, needed {i.qty}{i.unit}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {purchaseItem && (
        <PurchaseModal item={purchaseItem} onClose={() => setPurchaseItem(null)} onConfirm={confirmPurchase} />
      )}
    </div>
  );
}

/* ---------------------------------- app shell ---------------------------------- */

const TABS = [
  { id: 'plan', label: 'Meal Plan' },
  { id: 'bank', label: 'Recipe Bank' },
  { id: 'totry', label: 'To Try' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'list', label: 'Shopping List' },
];

export default function App() {
  const [recipes, setRecipes, recipesLoaded] = useStoredState('recipes_v1', SEED_RECIPES);
  const [toTry, setToTry, toTryLoaded] = useStoredState('totry_v1', []);
  const [settings, setSettings, settingsLoaded] = useStoredState('settings_v1', { shopType: 'weekday', vegOnly: false, veggieGoal: 14 });
  const [mealPlan, setMealPlan, planLoaded] = useStoredState('mealplan_v1', { weekday: {}, weekend: {} });
  const [checkedItems, setCheckedItems, checkedLoaded] = useStoredState('checkeditems_v1', {});
  const [pantry, setPantry, pantryLoaded] = useStoredState('pantry_v1', {});

  const [tab, setTab] = useState('plan');
  const [modal, setModal] = useState(null); // { recipe, afterSave }

  const allLoaded = recipesLoaded && toTryLoaded && settingsLoaded && planLoaded && checkedLoaded && pantryLoaded;

  function openAdd() { setModal({ recipe: emptyRecipe(null, !settings.vegOnly ? undefined : true), afterSave: null }); }
  function openEdit(recipe) { setModal({ recipe, afterSave: null }); }
  function openPromote(entry) {
    const r = emptyRecipe(null, undefined);
    r.name = entry.title;
    r.instructions = entry.text;
    setModal({ recipe: r, afterSave: null, promoteId: entry.id });
  }

  function handleSaveRecipe(cleaned) {
    setRecipes(prev => {
      const exists = prev.some(r => r.id === cleaned.id);
      return exists ? prev.map(r => r.id === cleaned.id ? cleaned : r) : [cleaned, ...prev];
    });
    if (modal?.afterSave) {
      const { shopType, slotId } = modal.afterSave;
      setMealPlan(prev => ({
        ...prev,
        [shopType]: { ...prev[shopType], [slotId]: { ...(prev[shopType]?.[slotId] || {}), recipeId: cleaned.id } },
      }));
    }
    if (modal?.promoteId) {
      setToTry(prev => prev.filter(e => e.id !== modal.promoteId));
    }
    setModal(null);
  }
  function handleDeleteRecipe(id) { setRecipes(prev => prev.filter(r => r.id !== id)); }
  function handleSendToPlan(recipeId, shopType, slotId) {
    const def = SLOT_DEFS[shopType].find(d => d.id === slotId);
    setMealPlan(prev => ({
      ...prev,
      [shopType]: {
        ...prev[shopType],
        [slotId]: { ...(prev[shopType]?.[slotId] || {}), recipeId, times: prev[shopType]?.[slotId]?.times ?? def.defaultTimes },
      },
    }));
    setSettings(prev => ({ ...prev, shopType }));
  }

  function handleLogPurchase(item, qtyBought) {
    const key = pantryKey(item.name, item.unit);
    setPantry(prev => {
      const existing = prev[key];
      const newQty = round1((existing?.qty || 0) + qtyBought);
      return { ...prev, [key]: { name: item.name, unit: item.unit, category: item.category, qty: newQty } };
    });
  }

  function handleUsePlanIngredients(shopType) {
    const defs = SLOT_DEFS[shopType];
    const planForShop = mealPlan[shopType] || {};
    setPantry(prev => {
      const next = { ...prev };
      defs.forEach(def => {
        const slot = planForShop[def.id];
        if (!slot || !slot.recipeId) return;
        const r = recipes.find(x => x.id === slot.recipeId);
        if (!r) return;
        const times = slot.times ?? def.defaultTimes;
        const servings = r.servings || 1;
        const factor = times / servings;
        (r.ingredients || []).forEach(ing => {
          const key = pantryKey(ing.name, ing.unit);
          const used = (parseFloat(ing.qty) || 0) * factor;
          if (next[key]) {
            next[key] = { ...next[key], qty: round1(Math.max(0, next[key].qty - used)) };
          }
        });
      });
      return next;
    });
  }

  if (!allLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center p-10" style={{ background: COLORS.paper }}>
        <p style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink }}>Opening the recipe box…</p>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.paper, minHeight: '100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&family=Permanent+Marker&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="relative max-w-5xl mx-auto px-4">
        <WineGlass width={76} height={176} style={{ position: 'absolute', right: '6%', top: 32 }} />
        <WineGlass width={76} height={176} style={{ position: 'absolute', left: '6%', top: 32, transform: 'scaleX(-1)' }} />
        <div className="relative text-center pt-16 pb-14 px-4 max-w-2xl mx-auto">
          <Star size={20} color={COLORS.forest} style={{ position: 'absolute', top: 10, left: '14%', transform: 'rotate(-14deg)' }} />
          <Star size={30} color={COLORS.oxblood} style={{ position: 'absolute', top: -6, right: '16%', transform: 'rotate(16deg)' }} />
          <Star size={16} color={COLORS.oxblood} style={{ position: 'absolute', top: '55%', left: '4%', transform: 'rotate(6deg)' }} />
          <Star size={22} color={COLORS.forest} style={{ position: 'absolute', bottom: 4, right: '8%', transform: 'rotate(-10deg)' }} />
          <h1 style={{ fontFamily: FONT_SCRIPT, color: COLORS.oxblood, lineHeight: 1, textTransform: 'uppercase' }} className="text-5xl sm:text-6xl">
            The Kitchen Companion
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <Rule weight={1} color={COLORS.cardEdge} />
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4">
          {TABS.map((t, i) => {
            const active = tab === t.id;
            return (
              <React.Fragment key={t.id}>
                {i > 0 && <span style={{ color: COLORS.cardEdge }}>·</span>}
                <button
                  onClick={() => setTab(t.id)}
                  className="text-sm transition pb-0.5"
                  style={{
                    fontFamily: FONT_STAMP,
                    letterSpacing: '0.06em',
                    fontWeight: active ? 600 : 400,
                    color: active ? COLORS.oxblood : COLORS.inkSoft,
                    borderBottom: active ? `2px solid ${COLORS.oxblood}` : '2px solid transparent',
                  }}
                >
                  {t.label.toUpperCase()}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <Rule weight={1} color={COLORS.cardEdge} />

        <div className="pb-16 pt-8">
          {tab === 'plan' && (
            <PlanTab
              recipes={recipes}
              settings={settings}
              setSettings={setSettings}
              mealPlan={mealPlan}
              setMealPlan={setMealPlan}
              onEdit={openEdit}
              onDelete={handleDeleteRecipe}
              onSendToPlan={handleSendToPlan}
              onAdd={openAdd}
              pantry={pantry}
              onUsePlanIngredients={handleUsePlanIngredients}
            />
          )}
          {tab === 'bank' && (
            <BankTab
              recipes={recipes}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={handleDeleteRecipe}
              onSendToPlan={handleSendToPlan}
              vegOnly={settings.vegOnly}
              setVegOnly={v => setSettings(prev => ({ ...prev, vegOnly: v }))}
            />
          )}
          {tab === 'totry' && <ToTryTab toTry={toTry} setToTry={setToTry} onPromote={openPromote} />}
          {tab === 'pantry' && <PantryTab pantry={pantry} setPantry={setPantry} />}
          {tab === 'list' && (
            <ListTab
              recipes={recipes}
              settings={settings}
              mealPlan={mealPlan}
              checkedItems={checkedItems}
              setCheckedItems={setCheckedItems}
              pantry={pantry}
              onLogPurchase={handleLogPurchase}
            />
          )}
        </div>
      </div>

      {modal && (
        <RecipeFormModal initial={modal.recipe} onClose={() => setModal(null)} onSave={handleSaveRecipe} />
      )}
    </div>
  );
}
