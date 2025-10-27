import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, AlertCircle, Video, Mic, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";

interface VOEditProps {
  onBack: () => void;
}

const VOEdit = ({ onBack }: VOEditProps) => {
  const { voId } = useParams<{ voId: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voProfile, setVoProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    is_active: true,
    is_featured: false,
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const loadVOProfile = async () => {
      console.log('VOEdit: useEffect triggered', { voId, profileId: profile?.id });

      if (!voId || !profile?.id) {
        console.log('VOEdit: Missing voId or profile.id, not loading');
        setLoading(false);
        return;
      }

      try {
        console.log('VOEdit: Starting to load VO profile...');
        setLoading(true);
        const { data, error } = await supabase
          .from('vo_profiles')
          .select('*')
          .eq('id', voId)
          .eq('user_id', profile.id)
          .single();

        console.log('VOEdit: Query result', { data, error });

        if (error) throw error;

        if (!data) {
          console.log('VOEdit: No data returned');
          setError('VO Profile not found or you do not have permission to edit it.');
          return;
        }

        console.log('VOEdit: VO profile loaded successfully', data);
        setVoProfile(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          tags: data.tags || [],
          is_active: data.is_active ?? true,
          is_featured: data.is_featured ?? false,
        });
      } catch (err) {
        console.error('VOEdit: Error loading VO profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load VO profile');
      } finally {
        console.log('VOEdit: Setting loading to false');
        setLoading(false);
      }
    };

    loadVOProfile();
  }, [voId, profile?.id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        tags: formData.tags,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('vo_profiles')
        .update(updates)
        .eq('id', voId)
        .eq('user_id', profile.id);

      if (error) throw error;

      setSuccess('VO Profile updated successfully!');
      setTimeout(() => {
        navigate('/dashboard/vos');
      }, 1500);
    } catch (err) {
      console.error('Error updating VO profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update VO profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading VO profile...</div>
        </div>
      </div>
    );
  }

  if (error && !voProfile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My VOs
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit VO Profile</h1>
          <p className="text-muted-foreground">Update your voice-over profile details</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Preview Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {voProfile?.recording_type === 'video' ? (
                <Video className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
              Media Info
            </CardTitle>
            <CardDescription>
              {voProfile?.recording_type === 'video' ? 'Video Recording' : 'Audio Recording'}
              {voProfile?.duration_seconds && ` • ${Math.floor(voProfile.duration_seconds / 60)}:${(voProfile.duration_seconds % 60).toString().padStart(2, '0')}`}
            </CardDescription>
          </CardHeader>
          {voProfile?.video_url && (
            <CardContent>
              <video
                src={voProfile.video_url}
                controls
                className="w-full aspect-video bg-black rounded-lg"
              />
            </CardContent>
          )}
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update the information displayed with your VO profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Professional Narration Demo"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe this VO profile, your style, or what makes it unique..."
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Tags */}
            <div>
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Add tags to help people discover your VO profile
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Type a tag and press Enter"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ✕
                  </Badge>
                ))}
                {formData.tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags added yet</p>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Active
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show this VO profile publicly
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_featured" className="text-sm font-medium">
                    Featured
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Highlight this as your featured VO profile
                  </p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onBack} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.title.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VOEdit;
