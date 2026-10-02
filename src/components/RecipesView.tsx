import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Clock,
  Users,
  ShoppingCart,
  Search,
  Check,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Recipe, RecipeIngredient } from '../types/todo';
import { ConfirmModal } from './ConfirmModal';
import { toastService } from '../services/toastService';

interface RecipesViewProps {
  recipes: Recipe[];
  isLoading: boolean;
  onAddRecipe: (data: {
    title: string;
    description?: string;
    servings: number;
    cookTime?: string;
    category: string;
    ingredients?: RecipeIngredient[];
    steps?: string[];
  }) => Promise<unknown>;
  onUpdateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  onAdjustServings: (id: string, delta: number) => Promise<void>;
  onDeleteRecipe: (id: string) => Promise<void>;
  onAddIngredientToShopping: (name: string, quantity: number, unit: string) => Promise<void>;
}

const RECIPE_CATEGORIES = [
  'ทั้งหมด',
  'อาหารจานเดียว',
  'อาหารเพื่อสุขภาพ',
  'ต้ม/แกง',
  'ผัด/ทอด',
  'ของหวาน',
  'เครื่องดื่ม'
];

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  isLoading,
  onAddRecipe,
  onUpdateRecipe,
  onAdjustServings,
  onDeleteRecipe,
  onAddIngredientToShopping,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(2);
  const [cookTime, setCookTime] = useState('20 นาที');
  const [category, setCategory] = useState('อาหารจานเดียว');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [newIngName, setNewIngName] = useState('');
  const [newIngAmount, setNewIngAmount] = useState(1);
  const [newIngUnit, setNewIngUnit] = useState('ชิ้น');
  const [newStepText, setNewStepText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setTitle('');
    setDescription('');
    setServings(2);
    setCookTime('20 นาที');
    setCategory('อาหารจานเดียว');
    setIngredients([]);
    setSteps([]);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (r: Recipe) => {
    setEditingRecipe(r);
    setTitle(r.title);
    setDescription(r.description || '');
    setServings(r.servings);
    setCookTime(r.cookTime || '20 นาที');
    setCategory(r.category);
    setIngredients(r.ingredients || []);
    setSteps(r.steps || []);
  };

  const handleAddIngredient = () => {
    if (!newIngName.trim()) return;
    setIngredients([
      ...ingredients,
      {
        id: 'ing_' + Math.random().toString(36).substring(2, 9),
        name: newIngName.trim(),
        amount: Number(newIngAmount) || 1,
        unit: newIngUnit.trim() || 'ชิ้น',
      },
    ]);
    setNewIngName('');
    setNewIngAmount(1);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setSteps([...steps, newStepText.trim()]);
    setNewStepText('');
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddRecipe({
        title: title.trim(),
        description: description.trim(),
        servings: Number(servings) || 1,
        cookTime: cookTime.trim(),
        category,
        ingredients,
        steps,
      });
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe || !title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onUpdateRecipe(editingRecipe.id, {
        title: title.trim(),
        description: description.trim(),
        servings: Number(servings) || 1,
        cookTime: cookTime.trim(),
        category,
        ingredients,
        steps,
      });
      setEditingRecipe(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAllToShopping = async (recipe: Recipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      toastService.info('สูตรนี้ยังไม่มีรายการวัตถุดิบ');
      return;
    }

    for (const ing of recipe.ingredients) {
      await onAddIngredientToShopping(ing.name, ing.amount, ing.unit);
    }
    toastService.success(`เพิ่มวัตถุดิบทั้งหมด (${recipe.ingredients.length} รายการ) ลงในตะกร้าซื้อของแล้ว!`);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecipeId) return;
    await onDeleteRecipe(deletingRecipeId);
    setDeletingRecipeId(null);
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      if (selectedCategory !== 'ทั้งหมด' && r.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [recipes, searchQuery, selectedCategory]);

  const recipeToDelete = recipes.find((r) => r.id === deletingRecipeId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Utensils className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              สูตรอาหาร & เมนูโปรด 🍲
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            บันทึกสูตร คำนวณสัดส่วนที่เสิร์ฟ และส่งวัตถุดิบไปรายการซื้อของได้ในคลิกเดียว
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>สร้างสูตรอาหารใหม่</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อเมนูหรือสูตรอาหาร..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {RECIPE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecipes.map((recipe) => {
          const isExpanded = expandedRecipeId === recipe.id;

          return (
            <div
              key={recipe.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                      {recipe.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {recipe.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(recipe)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                      title="แก้ไขสูตรอาหาร"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingRecipeId(recipe.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="ลบสูตรนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {recipe.description && (
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                {/* Metadata Row */}
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    <span>{recipe.cookTime || '15 นาที'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{recipe.ingredients?.length || 0} วัตถุดิบ</span>
                  </div>
                </div>

                {/* Expanded Ingredients & Steps */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in">
                    {/* Ingredients List */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                        <span>วัตถุดิบสำหรับ {recipe.servings} ที่:</span>
                        <button
                          onClick={() => handleAddAllToShopping(recipe)}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>ใส่รายการซื้อของ</span>
                        </button>
                      </h4>
                      <ul className="space-y-1">
                        {recipe.ingredients?.map((ing) => (
                          <li
                            key={ing.id}
                            className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg"
                          >
                            <span>• {ing.name}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {ing.amount} {ing.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Steps */}
                    {recipe.steps && recipe.steps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          วิธีทำ:
                        </h4>
                        <ol className="space-y-1.5">
                          {recipe.steps.map((st, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2"
                            >
                              <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                {/* ➖ ➕ Servings Adjust (Instant Firestore sync) */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => onAdjustServings(recipe.id, -1)}
                    disabled={recipe.servings <= 1}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shadow-xs disabled:opacity-40 transition-colors cursor-pointer"
                    title="ลดสัดส่วน 1 ที่เสิร์ฟ"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <span className="min-w-[48px] text-center text-xs font-bold text-slate-900 dark:text-white">
                    {recipe.servings} ที่เสิร์ฟ
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdjustServings(recipe.id, 1)}
                    className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-xs transition-colors cursor-pointer"
                    title="เพิ่มสัดส่วน 1 ที่เสิร์ฟ"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

                {/* Toggle details */}
                <button
                  onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>{isExpanded ? 'ย่อรายละเอียด' : 'ดูวิธีทำ & วัตถุดิบ'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}

        {filteredRecipes.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
            <Utensils className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'ไม่พบสูตรอาหารที่ค้นหา' : 'ยังไม่มีสูตรอาหาร'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              คลิกปุ่ม "+ สร้างสูตรอาหารใหม่" เพื่อบันทึกเมนูที่คุณชอบ
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Recipe Modal */}
      {(isAddModalOpen || editingRecipe) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRecipe ? 'แก้ไขสูตรอาหาร' : 'สร้างสูตรอาหารใหม่'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingRecipe(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingRecipe ? handleSubmitEdit : handleSubmitAdd}
              className="py-4 space-y-3.5 overflow-y-auto flex-1 pr-1"
            >
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ชื่อเมนู / สูตรอาหาร *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ข้าวกะเพราไก่ไข่ดาว"
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ที่เสิร์ฟ (Servings)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    เวลาทำ
                  </label>
                  <input
                    type="text"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="เช่น 15 นาที"
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    หมวดหมู่
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    {RECIPE_CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  คำอธิบายสรุป
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="ความน่ากินหรือจุดเด่นของเมนูนี้..."
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Ingredients Builder */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  รายการวัตถุดิบ ({ingredients.length})
                </label>

                {ingredients.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl text-xs"
                      >
                        <span>{ing.name} ({ing.amount} {ing.unit})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ing.id)}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newIngName}
                    onChange={(e) => setNewIngName(e.target.value)}
                    placeholder="ชื่อวัตถุดิบ..."
                    className="flex-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newIngAmount}
                    onChange={(e) => setNewIngAmount(Number(e.target.value))}
                    className="w-16 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    placeholder="หน่วย"
                    className="w-18 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={!newIngName.trim()}
                    className="p-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Steps Builder */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ขั้นตอนวิธีทำ ({steps.length})
                </label>

                {steps.length > 0 && (
                  <ol className="space-y-1.5 max-h-32 overflow-y-auto">
                    {steps.map((st, idx) => (
                      <li
                        key={idx}
                        className="flex items-start justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl text-xs gap-2"
                      >
                        <span>{idx + 1}. {st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStep();
                      }
                    }}
                    placeholder="พิมพ์ขั้นตอน แล้วกดเพิ่ม..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddStep}
                    disabled={!newStepText.trim()}
                    className="p-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingRecipe(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสูตร'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingRecipeId)}
        title="ยืนยันการลบสูตรอาหาร"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบสูตร "${recipeToDelete?.title || 'รายการนี้'}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRecipeId(null)}
      />
    </div>
  );
};
