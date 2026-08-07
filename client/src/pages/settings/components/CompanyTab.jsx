import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { TextArea } from '../../../components/ui/TextArea.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { settingsService } from '../../../services/settingsService.js';
import { FullPageLoader } from '../../../components/common/Loader.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';

export const CompanyTab = () => {
  const { data: settings, isLoading, error, refetch, setData } = useApiQuery(() => settingsService.getCompany(), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    values: settings
      ? {
          companyName: settings.companyName || '',
          industry: settings.industry || '',
          website: settings.website || '',
          supportEmail: settings.supportEmail || '',
          phone: settings.phone || '',
          address: settings.address || '',
        }
      : undefined,
  });

  const onSubmit = async (values) => {
    try {
      const updated = await settingsService.updateCompany(values);
      setData(updated);
      reset(values);
      toast.success('Company settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update company settings.');
    }
  };

  if (isLoading) return <FullPageLoader label="Loading company settings…" />;
  if (error) return <ErrorState message="Couldn't load company settings." onRetry={refetch} />;

  return (
    <Card>
      <CardHeader title="Company Settings" subtitle="Shown across the CRM and in outgoing emails" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-5 py-5" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Company name"
            error={errors.companyName?.message}
            {...register('companyName', { maxLength: { value: 150, message: 'Too long' } })}
          />
          <Input label="Industry" error={errors.industry?.message} {...register('industry', { maxLength: 100 })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Website"
            placeholder="https://example.com"
            error={errors.website?.message}
            {...register('website')}
          />
          <Input
            label="Support email"
            type="email"
            error={errors.supportEmail?.message}
            {...register('supportEmail')}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Phone" error={errors.phone?.message} {...register('phone', { maxLength: 30 })} />
        </div>
        <TextArea label="Address" rows={3} error={errors.address?.message} {...register('address', { maxLength: 300 })} />
        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
};
