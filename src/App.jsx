import React, { useState, useEffect, useMemo } from 'react';
import { Book, Plus, X, Shuffle, ShoppingCart, Leaf, Share2, Copy, Trash2, Pencil, Clock, ChefHat, NotebookText, Coffee, Sandwich, UtensilsCrossed, Cookie, Sprout, ArrowRight, Image as ImageIcon } from 'lucide-react';

/* ---------------------------------- tokens ---------------------------------- */

const COLORS = {
  paper: '#FFFFFF',
  paperDark: '#F3F4EC',
  card: '#FFFFFF',
  cardEdge: '#E1E5D6',
  ink: '#2C2B22',
  inkSoft: '#726C5C',
  oxblood: '#B15E3F',
  oxbloodDark: '#8E4A32',
  forest: '#5C7048',
  mustard: '#C7973E',
  cream: '#FEFDF9',
  sageLine: '#D3DAC4',
  bandGold: '#DCB35C',
  bandSage: '#8CA06B',
  bandForest: '#526B41',
  bandClay: '#C48765',
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Libre Baskerville', Georgia, serif";
const FONT_STAMP = "'Inter', -apple-system, sans-serif";

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

const CHIP_TONES = {
  sage: { bg: '#EEF1E4', text: COLORS.forest },
  clay: { bg: '#F7E9E0', text: COLORS.oxblood },
};

function Stamp({ children, tone = 'sage', icon: Icon = null }) {
  const t = CHIP_TONES[tone];
  return (
    <span
      style={{
        fontFamily: FONT_BODY,
        fontSize: 11,
        color: t.text,
        background: t.bg,
        borderRadius: 6,
        padding: '3px 9px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        lineHeight: 1.3,
      }}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function SprigDivider() {
  return (
    <div className="flex items-center justify-center gap-3 px-4" style={{ maxWidth: 420, margin: '0 auto' }}>
      <span style={{ flex: 1, height: 1, background: COLORS.sageLine }} />
      <Leaf size={13} color={COLORS.forest} style={{ transform: 'rotate(-10deg)' }} />
      <Sprout size={15} color={COLORS.oxblood} />
      <Leaf size={13} color={COLORS.forest} style={{ transform: 'rotate(190deg)' }} />
      <span style={{ flex: 1, height: 1, background: COLORS.sageLine }} />
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={22} color={COLORS.oxblood} />}
      <h2 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 800 }} className="text-2xl">
        {children}
      </h2>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full transition"
      style={{
        border: `1.5px solid ${checked ? COLORS.forest : COLORS.cardEdge}`,
        background: checked ? COLORS.forest : 'transparent',
        color: checked ? COLORS.cream : COLORS.inkSoft,
        fontFamily: FONT_STAMP,
        fontSize: 12,
      }}
    >
      <Leaf size={14} />
      {label}
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
              <div className="w-16 h-16 rounded flex items-center justify-center" style={{ background: '#F3F4EC' }}>
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
                    background: r.tags.includes(t.key) ? COLORS.forest : '#EEF1E4',
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

function bandForRecipe(recipe) {
  const joined = recipe.tags.join(' ');
  if (/Breakfast/i.test(joined) || recipe.tags.some(t => t.toLowerCase().includes('breakfast'))) return { color: COLORS.bandGold, Icon: Coffee };
  if (recipe.tags.some(t => t.toLowerCase().includes('lunch'))) return { color: COLORS.bandSage, Icon: Sandwich };
  if (recipe.tags.some(t => t.toLowerCase().includes('dinner'))) return { color: COLORS.bandForest, Icon: UtensilsCrossed };
  if (recipe.tags.some(t => t.toLowerCase().includes('snack'))) return { color: COLORS.bandClay, Icon: Cookie };
  return { color: COLORS.bandSage, Icon: Leaf };
}

function eligibleSlots(recipe) {
  const out = [];
  ['weekday', 'weekend'].forEach(shopType => {
    SLOT_DEFS[shopType].forEach(def => {
      if (recipe.tags.includes(def.tag)) out.push({ shopType, slotId: def.id, label: `${shopType === 'weekday' ? 'Weekday' : 'Weekend'} — ${def.label}` });
    });
  });
  return out;
}

function RecipeCard({ recipe, idx, onEdit, onDelete, onSendToPlan }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sentLabel, setSentLabel] = useState(null);
  const { color: bandColor, Icon: BandIcon } = bandForRecipe(recipe);
  const slots = eligibleSlots(recipe);

  function handleSend(slot) {
    onSendToPlan(recipe.id, slot.shopType, slot.slotId);
    setSentLabel(slot.label);
    setMenuOpen(false);
    setTimeout(() => setSentLabel(null), 2200);
  }

  return (
    <div
      className="rounded-lg overflow-hidden relative w-full mb-5 transition-shadow hover:shadow-lg"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.cardEdge}`, boxShadow: '0 2px 8px rgba(44,43,34,0.06)', breakInside: 'avoid', display: 'inline-block' }}
    >
      {recipe.image ? (
        <div className="relative">
          <img src={recipe.image} alt={recipe.name} className="w-full object-cover" style={{ height: 150 }} />
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={() => onEdit(recipe)} className="p-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.85)' }}><Pencil size={13} color={COLORS.inkSoft} /></button>
            <button onClick={() => onDelete(recipe.id)} className="p-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.85)' }}><Trash2 size={13} color={COLORS.oxblood} /></button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-5" style={{ background: bandColor }}>
          <BandIcon size={26} color={COLORS.cream} />
          <div className="flex gap-2">
            <button onClick={() => onEdit(recipe)}><Pencil size={15} color={COLORS.cream} /></button>
            <button onClick={() => onDelete(recipe.id)}><Trash2 size={15} color={COLORS.cream} /></button>
          </div>
        </div>
      )}

      <div className="p-4">
        <h4 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700 }} className="text-lg leading-tight mb-2">
          {recipe.name}
        </h4>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {recipe.vegetarian && <Stamp tone="clay" icon={Leaf}>Veg</Stamp>}
          {recipe.tags.map(t => <Stamp key={t}>{TAG_LABEL[t]}</Stamp>)}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mb-2" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>
          <span>{recipe.calories} kcal</span>
          <span>{recipe.protein}g protein</span>
          <span>{recipe.carbs}g carbs</span>
          <span>serves {recipe.servings}</span>
        </div>

        {recipe.prepAhead && (
          <div className="flex items-start gap-1 text-xs mb-2" style={{ color: COLORS.mustard, fontFamily: FONT_BODY }}>
            <Clock size={13} className="mt-0.5 shrink-0" />
            <span>{recipe.prepAhead}</span>
          </div>
        )}

        <details className="mb-3">
          <summary className="text-xs cursor-pointer" style={{ fontFamily: FONT_STAMP, color: COLORS.forest }}>
            ingredients &amp; method
          </summary>
          <div className="mt-2 text-sm" style={{ fontFamily: FONT_BODY, color: COLORS.ink }}>
            <ul className="list-disc list-inside mb-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{ing.qty ? `${ing.qty} ${ing.unit} ` : ''}{ing.name}</li>
              ))}
            </ul>
            <p>{recipe.instructions}</p>
          </div>
        </details>

        <div className="relative" style={{ borderTop: `1px solid ${COLORS.cardEdge}`, paddingTop: 10 }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            disabled={slots.length === 0}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs disabled:opacity-40"
            style={{ fontFamily: FONT_STAMP, border: `1.5px solid ${COLORS.forest}`, color: COLORS.forest }}
          >
            {sentLabel ? `Added → ${sentLabel}` : <>Plan for this week <ArrowRight size={13} /></>}
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

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)} placeholder="search recipes…"
          className="px-3 py-1.5 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream, fontFamily: FONT_BODY }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {TAGS.map(t => (
          <button key={t.key} onClick={() => toggleFilterTag(t.key)}
            className="px-3 py-1 rounded-md text-xs border-0"
            style={{
              fontFamily: FONT_BODY,
              background: activeTags.includes(t.key) ? COLORS.oxblood : '#F7E9E0',
              color: activeTags.includes(t.key) ? COLORS.cream : COLORS.oxblood,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY }}>No recipes match yet — add one, or loosen your filters.</p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
          {filtered.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} idx={i} onEdit={onEdit} onDelete={onDelete} onSendToPlan={onSendToPlan} />
          ))}
        </div>
      )}
    </div>
  );
}

function BankTab({ recipes, onAdd, onEdit, onDelete, onSendToPlan, vegOnly, setVegOnly }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <SectionTitle icon={Book}>The Recipe Bank</SectionTitle>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
          style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
          <Plus size={15} /> Add Recipe
        </button>
      </div>

      <div className="mb-4">
        <Toggle checked={vegOnly} onChange={setVegOnly} label="Vegetarian only" />
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
      <SectionTitle icon={NotebookText}>Recipes to Try</SectionTitle>
      <p className="text-sm mb-4" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
        A scrap drawer for recipes you've spotted but haven't cooked yet. Paste them in, and promote the good ones to the Bank once you've tried them.
      </p>

      <div className="rounded p-4 mb-6" style={{ background: COLORS.card, border: `1px solid ${COLORS.cardEdge}` }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g. Mum's Focaccia idea)"
          className="w-full px-3 py-2 rounded text-sm mb-2" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream, fontFamily: FONT_BODY }} />
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Paste the recipe, a link, or your notes here…"
          className="w-full px-3 py-2 rounded text-sm mb-2" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream, fontFamily: FONT_BODY }} />
        <button onClick={addEntry} className="px-4 py-2 rounded text-sm" style={{ fontFamily: FONT_STAMP, background: COLORS.forest, color: COLORS.cream }}>
          Save Clipping
        </button>
      </div>

      <div className="space-y-3">
        {toTry.length === 0 && <p className="text-sm" style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY }}>Nothing saved yet.</p>}
        {toTry.map(entry => (
          <div key={entry.id} className="rounded p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.cardEdge}` }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink }} className="text-base font-bold">{entry.title}</h4>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onPromote(entry)} className="text-xs px-2 py-1 rounded"
                  style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
                  Promote to Bank
                </button>
                <button onClick={() => removeEntry(entry.id)}><Trash2 size={15} color={COLORS.oxblood} /></button>
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

function PlanTab({ recipes, settings, setSettings, mealPlan, setMealPlan, onEdit, onDelete, onSendToPlan, onAdd }) {
  const shopType = settings.shopType;
  const defs = SLOT_DEFS[shopType];
  const planForShop = mealPlan[shopType] || {};

  function setSlot(slotId, field, value) {
    setMealPlan(prev => ({
      ...prev,
      [shopType]: {
        ...prev[shopType],
        [slotId]: { ...(prev[shopType]?.[slotId] || {}), [field]: value },
      },
    }));
  }

  function generateSuggestions() {
    const used = new Set();
    const newSlots = {};
    defs.forEach(def => {
      const pool = recipes.filter(r => r.tags.includes(def.tag) && (!settings.vegOnly || r.vegetarian));
      const fresh = pool.filter(r => !used.has(r.id));
      const choices = fresh.length ? fresh : pool;
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
      <SectionTitle icon={ChefHat}>The Meal Plan</SectionTitle>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-full overflow-hidden" style={{ border: `1.5px solid ${COLORS.oxblood}` }}>
          {['weekday', 'weekend'].map(st => (
            <button key={st} onClick={() => setSettings(prev => ({ ...prev, shopType: st }))}
              className="px-4 py-1.5 text-sm"
              style={{
                fontFamily: FONT_STAMP,
                background: shopType === st ? COLORS.oxblood : 'transparent',
                color: shopType === st ? COLORS.cream : COLORS.oxblood,
              }}>
              {st === 'weekday' ? 'Weekday Shop' : 'Weekend Shop'}
            </button>
          ))}
        </div>
        <Toggle checked={settings.vegOnly} onChange={v => setSettings(prev => ({ ...prev, vegOnly: v }))} label="Vegetarian only" />
        <button onClick={generateSuggestions} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm"
          style={{ fontFamily: FONT_STAMP, background: COLORS.forest, color: COLORS.cream }}>
          <Shuffle size={14} /> Generate Suggestions
        </button>
        <button onClick={clearPlan} className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>clear this plan</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 space-y-4">
          {defs.map(def => {
            const slot = planForShop[def.id] || {};
            const times = slot.times ?? def.defaultTimes;
            const chosen = recipes.find(r => r.id === slot.recipeId);
            return (
              <div key={def.id} className="rounded p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.cardEdge}` }}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span style={{ fontFamily: FONT_STAMP, color: COLORS.oxblood, fontSize: 13 }}>{def.label}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>times this period</label>
                    <input type="number" min={0} value={times} onChange={e => setSlot(def.id, 'times', parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }} />
                  </div>
                </div>

                {chosen ? (
                  <div className="flex items-center gap-3">
                    {chosen.image ? (
                      <img src={chosen.image} alt="" className="w-14 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-14 h-14 rounded flex items-center justify-center shrink-0" style={{ background: bandForRecipe(chosen).color }}>
                        {React.createElement(bandForRecipe(chosen).Icon, { size: 20, color: COLORS.cream })}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700 }} className="text-base truncate">{chosen.name}</p>
                      <p className="text-xs" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>{chosen.calories} kcal · {chosen.protein}g protein</p>
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

        <div className="rounded p-5 h-fit" style={{ background: COLORS.paperDark, border: `1px solid ${COLORS.cardEdge}` }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700 }} className="text-lg mb-3">
            Nutrition — {shopType === 'weekday' ? 'work week' : 'weekend'}
          </h3>
          <div className="space-y-3 text-sm" style={{ fontFamily: FONT_BODY, color: COLORS.ink }}>
            <StatRow label="Total calories" value={`${Math.round(nutrition.cal)} kcal`} sub={`~${Math.round(nutrition.cal / days)} kcal/day`} />
            <StatRow label="Protein" value={`${round1(nutrition.protein)} g`} sub={`~${round1(nutrition.protein / days)} g/day`} />
            <StatRow label="Carbs" value={`${round1(nutrition.carbs)} g`} sub={`~${round1(nutrition.carbs / days)} g/day`} />
            <div>
              <div className="flex justify-between">
                <span>Veggie servings</span>
                <span className="font-bold">{round1(nutrition.veggie)} / {round1(goalForPeriod)}</span>
              </div>
              <div className="w-full h-2 rounded-full mt-1" style={{ background: COLORS.cardEdge }}>
                <div className="h-2 rounded-full" style={{
                  width: `${Math.min(100, (nutrition.veggie / goalForPeriod) * 100)}%`,
                  background: COLORS.forest,
                }} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${COLORS.cardEdge}` }}>
            <label className="block text-xs mb-1" style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft }}>WEEKLY VEGGIE GOAL (servings)</label>
            <input type="number" value={settings.veggieGoal} onChange={e => setSettings(prev => ({ ...prev, veggieGoal: parseFloat(e.target.value) || 0 }))}
              className="w-24 px-2 py-1 rounded text-sm" style={{ border: `1px solid ${COLORS.cardEdge}`, background: COLORS.cream }} />
          </div>
          <p className="text-xs mt-3" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
            A loose guide, not a strict count — enough to sense-check the week.
          </p>
        </div>
      </div>

      <div className="pt-2" style={{ borderTop: `1px solid ${COLORS.cardEdge}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-8 mb-2">
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700 }} className="text-xl">Recipe Gallery</h3>
            <p className="text-sm" style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
              Scroll through the bank and tap "Plan for this week" to slot a recipe straight in.
            </p>
          </div>
          <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm shrink-0"
            style={{ fontFamily: FONT_STAMP, background: COLORS.oxblood, color: COLORS.cream }}>
            <Plus size={15} /> Add Recipe
          </button>
        </div>
        <RecipeGallery recipes={recipes} vegOnly={settings.vegOnly} onEdit={onEdit} onDelete={onDelete} onSendToPlan={onSendToPlan} />
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

/* ---------------------------------- shopping list tab ---------------------------------- */

function ListTab({ recipes, settings, mealPlan }) {
  const shopType = settings.shopType;
  const defs = SLOT_DEFS[shopType];
  const planForShop = mealPlan[shopType] || {};
  const [copied, setCopied] = useState(false);

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
        const key = `${(ing.name || '').trim().toLowerCase()}|${(ing.unit || '').trim().toLowerCase()}`;
        if (!map[key]) map[key] = { name: ing.name, unit: ing.unit, category: ing.category || 'Other', qty: 0, from: new Set() };
        map[key].qty += (parseFloat(ing.qty) || 0) * factor;
        map[key].from.add(r.name);
      });
    });
    return Object.values(map).map(i => ({ ...i, qty: round1(i.qty), from: [...i.from] }));
  }, [recipes, planForShop, defs]);

  const grouped = {};
  list.forEach(i => { (grouped[i.category] = grouped[i.category] || []).push(i); });

  function buildText() {
    let text = `🧺 ${shopType === 'weekday' ? 'Weekday' : 'Weekend'} Shopping List\n\n`;
    CATEGORIES.forEach(cat => {
      if (!grouped[cat] || !grouped[cat].length) return;
      text += `${cat.toUpperCase()}\n`;
      grouped[cat].forEach(i => {
        text += `☐ ${i.name}${i.qty ? ` — ${i.qty}${i.unit ? ' ' + i.unit : ''}` : ''}\n`;
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
      <SectionTitle icon={ShoppingCart}>Shopping List — {shopType === 'weekday' ? 'Weekday' : 'Weekend'} Shop</SectionTitle>

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

          <div className="rounded-lg p-6 max-w-xl" style={{ background: COLORS.cream, border: `1px solid ${COLORS.cardEdge}`, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
            {CATEGORIES.map(cat => (
              grouped[cat] && grouped[cat].length > 0 && (
                <div key={cat} className="mb-4">
                  <h4 style={{ fontFamily: FONT_STAMP, color: COLORS.oxblood, fontSize: 12, letterSpacing: '0.08em' }} className="uppercase mb-2">{cat}</h4>
                  <ul className="space-y-1">
                    {grouped[cat].map((i, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm" style={{ fontFamily: FONT_BODY, color: COLORS.ink }}>
                        <span style={{ width: 14, height: 14, border: `1.5px solid ${COLORS.inkSoft}`, display: 'inline-block', flexShrink: 0 }} />
                        {i.name}{i.qty ? ` — ${i.qty}${i.unit ? ' ' + i.unit : ''}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------- app shell ---------------------------------- */

const TABS = [
  { id: 'plan', label: 'Meal Plan', icon: ChefHat },
  { id: 'bank', label: 'Recipe Bank', icon: Book },
  { id: 'totry', label: 'To Try', icon: NotebookText },
  { id: 'list', label: 'Shopping List', icon: ShoppingCart },
];

export default function App() {
  const [recipes, setRecipes, recipesLoaded] = useStoredState('recipes_v1', SEED_RECIPES);
  const [toTry, setToTry, toTryLoaded] = useStoredState('totry_v1', []);
  const [settings, setSettings, settingsLoaded] = useStoredState('settings_v1', { shopType: 'weekday', vegOnly: false, veggieGoal: 14 });
  const [mealPlan, setMealPlan, planLoaded] = useStoredState('mealplan_v1', { weekday: {}, weekend: {} });

  const [tab, setTab] = useState('plan');
  const [modal, setModal] = useState(null); // { recipe, afterSave }

  const allLoaded = recipesLoaded && toTryLoaded && settingsLoaded && planLoaded;

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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      <div className="text-center pt-8 pb-5 px-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sprout size={24} color={COLORS.forest} />
          <h1 style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 800 }} className="text-3xl sm:text-4xl">
            The Kitchen Companion
          </h1>
        </div>
        <p style={{ fontFamily: FONT_STAMP, color: COLORS.inkSoft, letterSpacing: '0.08em' }} className="text-xs uppercase mb-4">
          a hand-kept book of meals, mealpreps &amp; market lists
        </p>
        <SprigDivider />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-wrap gap-2 justify-center my-6">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm transition"
                style={{
                  fontFamily: FONT_STAMP,
                  background: active ? COLORS.paperDark : 'transparent',
                  color: active ? COLORS.forest : COLORS.inkSoft,
                  borderBottom: active ? `3px solid ${COLORS.forest}` : '3px solid transparent',
                }}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="pb-16">
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
          {tab === 'list' && <ListTab recipes={recipes} settings={settings} mealPlan={mealPlan} />}
        </div>
      </div>

      {modal && (
        <RecipeFormModal initial={modal.recipe} onClose={() => setModal(null)} onSave={handleSaveRecipe} />
      )}
    </div>
  );
}
