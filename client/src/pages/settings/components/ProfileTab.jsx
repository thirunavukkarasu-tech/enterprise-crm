import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { userService } from '../../../services/userService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { ROLE_LABELS } from '../../../utils/roles.js';
import { FullPageLoader } from '../../../components/common/Loader.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';

const getInitials = (name = '') =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // matches server/src/middleware/upload.js

export const ProfileTab = () => {
  const { updateUser } = useAuth();
  const { data: profile, isLoading, error, refetch, setData } = useApiQuery(() => userService.getMyProfile(), []);
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    values: profile ? { name: profile.name, phone: profile.phone || '', jobTitle: profile.jobTitle || '' } : undefined,
  });

  const onSubmit = async (values) => {
    try {
      const updated = await userService.updateMyProfile(values);
      setData(updated);
      updateUser(updated);
      reset(values);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update your profile.');
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Image is too large — the limit is 2MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updated = await userService.uploadMyAvatar(file);
      setData(updated);
      updateUser(updated);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload your avatar.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) return <FullPageLoader label="Loading your profile…" />;
  if (error) return <ErrorState message="Couldn't load your profile." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-500 text-2xl font-semibold text-white">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(profile.name)
              )}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-100 bg-ink text-white hover:bg-ink-700 disabled:opacity-50"
              aria-label="Change avatar"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink">{profile.name}</p>
            <p className="text-sm text-ink-600">{profile.email}</p>
            <p className="mt-1 text-xs font-medium text-brand-600">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Personal Information" subtitle="Update your name and contact details" />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-5 py-5" noValidate>
          <Input
            label="Full name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required', maxLength: { value: 80, message: 'Too long' } })}
          />
          <Input label="Email" value={profile.email} disabled className="cursor-not-allowed opacity-70" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Phone" error={errors.phone?.message} {...register('phone', { maxLength: 30 })} />
            <Input label="Job title" error={errors.jobTitle?.message} {...register('jobTitle', { maxLength: 100 })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
