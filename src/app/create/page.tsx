'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Plus, X } from 'lucide-react';

interface Outcome {
    name: string;
    color: string;
}

export default function CreateMarketPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        question: '',
        category: 'Pals',
        endDate: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [imageUrl, setImageUrl] = useState('');
    const [outcomes, setOutcomes] = useState<Outcome[]>([
        { name: 'Yes', color: '#22c55e' },
        { name: 'No', color: '#ef4444' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        setIsAuthenticated(true);
        setLoading(false);
    };

    const addOutcome = () => {
        setOutcomes([...outcomes, { name: '', color: '#3b82f6' }]);
    };

    const removeOutcome = (index: number) => {
        if (outcomes.length > 2) {
            setOutcomes(outcomes.filter((_, i) => i !== index));
        }
    };

    const updateOutcome = (index: number, field: 'name' | 'color', value: string) => {
        const updated = [...outcomes];
        updated[index][field] = value;
        setOutcomes(updated);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            // Clear the URL input if file is selected
            setImageUrl('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const supabase = createClient();
            // 1. Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('You must be logged in to create a market.');
                router.push('/login');
                return;
            }

            // 2. Validate outcomes
            if (outcomes.some(o => !o.name.trim())) {
                alert('All outcomes must have a name.');
                setIsSubmitting(false);
                return;
            }

            let finalImageUrl = imageUrl;

            // 3. Upload image if file is selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('market-images')
                    .upload(fileName, imageFile);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    alert('Failed to upload image: ' + uploadError.message);
                    setIsSubmitting(false);
                    return;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('market-images')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            // 4. Create Market
            const { data: market, error: marketError } = await supabase
                .from('markets')
                .insert({
                    question: formData.question,
                    category: formData.category,
                    end_date: new Date(formData.endDate).toISOString(),
                    image_url: finalImageUrl || null,
                    status: 'active',
                    volume: 0
                })
                .select()
                .single();

            if (marketError) throw marketError;

            // 5. Create Outcomes
            const probabilityPerOutcome = Math.floor(100 / outcomes.length);
            const outcomeRecords = outcomes.map((outcome, index) => ({
                id: outcome.name.toLowerCase().replace(/\s+/g, '-'),
                market_id: market.id,
                name: outcome.name,
                probability: probabilityPerOutcome,
                color: outcome.color
            }));

            const { error: outcomesError } = await supabase
                .from('market_outcomes')
                .insert(outcomeRecords);

            if (outcomesError) throw outcomesError;

            router.push(`/market/${market.id}`);
            router.refresh();

        } catch (error: any) {
            console.error('Error creating market:', error);
            alert('Error creating market: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Market</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border border-border">
                <div>
                    <label className="block text-sm font-medium mb-2">Question</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g., Will it rain tomorrow?"
                        className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                        className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option value="Pals">Pals</option>
                        <option value="General">General</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Politics">Politics</option>
                        <option value="Sports">Sports</option>
                        <option value="Tech">Tech</option>
                        <option value="Entertainment">Entertainment</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground [color-scheme:dark]"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Market Image</label>

                    {imagePreview && (
                        <div className="mb-3 relative w-full h-48 rounded-lg overflow-hidden border border-border">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => {
                                    setImageFile(null);
                                    setImagePreview('');
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-lg hover:bg-destructive/90"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <label className="flex-1 px-4 py-2 rounded-lg bg-secondary/30 border border-border hover:border-primary cursor-pointer transition-colors text-center">
                            <span className="text-sm text-foreground">
                                {imageFile ? imageFile.name : 'Choose from device'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>

                    <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground">OR</span>
                        <div className="flex-1 h-px bg-border"></div>
                    </div>

                    <input
                        type="url"
                        placeholder="Paste image URL..."
                        className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                        value={imageUrl}
                        onChange={(e) => {
                            setImageUrl(e.target.value);
                            if (e.target.value) {
                                setImageFile(null);
                                setImagePreview('');
                            }
                        }}
                        disabled={!!imageFile}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium">Outcomes</label>
                        <button
                            type="button"
                            onClick={addOutcome}
                            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                            <Plus size={16} />
                            Add Outcome
                        </button>
                    </div>
                    <div className="space-y-3">
                        {outcomes.map((outcome, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    required
                                    placeholder="Outcome name"
                                    className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                                    value={outcome.name}
                                    onChange={(e) => updateOutcome(index, 'name', e.target.value)}
                                />
                                <input
                                    type="color"
                                    className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                                    value={outcome.color}
                                    onChange={(e) => updateOutcome(index, 'color', e.target.value)}
                                />
                                {outcomes.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOutcome(index)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Probabilities will be distributed equally among all outcomes
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Create Market'
                    )}
                </button>
            </form>
        </div>
    );
}

