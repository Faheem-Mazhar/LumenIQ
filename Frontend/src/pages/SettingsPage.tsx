import { useState } from 'react';
import { useBusiness } from '../auth/hooks/useBusiness';
import { 
  User, 
  Bell, 
  CreditCard, 
  Building, 
  MapPin,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { AddBusinessModal } from '../modals/AddBusinessModal';
import { PlanSelectionModal } from '../modals/PlanSelectionModal';
import { PaymentMethodModal } from '../modals/PaymentMethodModal';
import {
  type Business,
  type CurrentPlan,
  MOCK_CURRENT_PLAN,
  MOCK_PERSONAL_INFO,
  MOCK_NOTIFICATION_DEFAULTS,
  MOCK_PAYMENT_METHOD,
} from '../mockData';

export function SettingsPage() {
  const currentPlan: CurrentPlan = MOCK_CURRENT_PLAN;

  const {
    businesses,
    activeBusiness,
    switchBusiness: switchBusinessById,
    addBusiness: addBusinessToStore,
    removeBusiness: removeBusinessFromStore,
    updateBusinessFields,
  } = useBusiness();
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);
  const [newBusiness, setNewBusiness] = useState<Partial<Business>>({
    name: '',
    description: '',
    websiteUrl: '',
    instagramHandle: '',
    brandColor: '#3b82f6',
    location: ''
  });

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATION_DEFAULTS);

  const [personalInfo, setPersonalInfo] = useState(MOCK_PERSONAL_INFO);

  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const currentPlanId = `${
    currentPlan.type.toLowerCase().includes('digital') ? 'digital' : 'physical'
  }-${currentPlan.name.toLowerCase()}`;

  const canAddMoreBrands = businesses.length < currentPlan.maxBrands;

  const handleSwitchBusiness = (business: Business) => {
    switchBusinessById(business.id);
  };

  const handleAddBusiness = () => {
    if (!newBusiness.name) return;
    
    const business: Business = {
      id: Date.now().toString(),
      name: newBusiness.name,
      description: newBusiness.description || '',
      websiteUrl: newBusiness.websiteUrl || '',
      instagramHandle: newBusiness.instagramHandle || '',
      brandColor: newBusiness.brandColor || '#3b82f6',
      location: newBusiness.location || '',
      isActive: false
    };

    addBusinessToStore(business);
    setNewBusiness({
      name: '',
      description: '',
      websiteUrl: '',
      instagramHandle: '',
      brandColor: '#3b82f6',
      location: ''
    });
    setIsAddBusinessOpen(false);
  };

  const handleDeleteBusiness = (id: string) => {
    if (businesses.length <= 1) {
      alert('You must have at least one business');
      return;
    }
    if (window.confirm('Are you sure you want to delete this business?')) {
      removeBusinessFromStore(id);
    }
  };

  const handleUpdateBusiness = (field: keyof Business, value: string) => {
    const b = activeBusiness ?? businesses[0];
    if (!b) return;
    updateBusinessFields(b.id, { [field]: value });
  };

  const handleSaveBusiness = () => {
    setIsEditingBusiness(false);
    setIsSavingBusiness(true);
    window.setTimeout(() => {
      setIsSavingBusiness(false);
    }, 1600);
  };

  const handleSavePersonal = () => {
    setIsEditingPersonal(false);
    setIsSavingPersonal(true);
    window.setTimeout(() => {
      setIsSavingPersonal(false);
    }, 1600);
  };

  const selectedBusiness = activeBusiness ?? businesses[0];
  if (!selectedBusiness) {
    return (
      <div className="mx-auto max-w-[88rem] px-4 pb-16 pt-10">
        <p className="text-slate-600">No businesses found.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-900 font-switzer">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl" />
      </div>
      <div className="mx-auto max-w-[88rem] space-y-8 px-4 pb-16 pt-10 font-switzer">
        <div className="space-y-2">
          <h2 className="text-3xl font-outfit text-slate-900">Business Preferences</h2>
          <p className="text-slate-600">Manage your account and business preferences</p>
        </div>

        <Tabs defaultValue="businesses" className="space-y-6">
          <TabsList className="w-full flex justify-between rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm lg:w-auto">
            <TabsTrigger
              value="businesses"
              className="flex items-center rounded-xl text-sm  text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Businesses</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="flex items-center rounded-xl text-sm  text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center rounded-xl text-sm  text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="flex items-center rounded-xl text-sm  text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

        {/* Businesses Tab */}
        <TabsContent value="businesses" className="space-y-6">
          {/* Current Plan Info */}
          <Card className="p-6 rounded-2xl border border-blue-100/80 bg-gradient-to-br from-white via-blue-50 to-slate-50 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-outfit text-slate-900">{currentPlan.name} Plan</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs  bg-blue-600 text-white">
                    {currentPlan.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Using {businesses.length} of {currentPlan.maxBrands} available brands
                </p>
                <div className="w-full bg-slate-200/60 rounded-full h-2">
                  <div 
                    className="gradient-blue-primary h-2 rounded-full transition-all"
                    style={{ width: `${(businesses.length / currentPlan.maxBrands) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-outfit text-slate-900">${currentPlan.price}</div>
                <div className="text-sm text-slate-600">/month</div>
              </div>
            </div>
          </Card>

          {/* Select or Add Business */}
          <Card className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-outfit text-slate-900">Your Businesses</h3>
              {canAddMoreBrands && (
                <Button
                  onClick={() => setIsAddBusinessOpen(true)}
                  size="sm"
                  className="gradient-blue-primary text-white hover:opacity-90 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Business
                </Button>
              )}
            </div>

            {/* Business List */}
            <div className="space-y-2">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleSwitchBusiness(business)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    business.isActive
                      ? 'border-blue-500/70 bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white/80 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-outfit"
                        style={{ backgroundColor: business.brandColor }}
                      >
                        {business.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-outfit text-slate-900 flex items-center gap-2">
                          {business.name}
                          {business.isActive && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{business.description}</p>
                        {business.location && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            {business.location}
                          </div>
                        )}
                      </div>
                    </div>
                    {businesses.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBusiness(business.id);
                        }}
                        className="text-rose-600 hover:bg-rose-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {!canAddMoreBrands && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">
                  You've reached the maximum number of businesses for your plan. 
                  <button className="text-blue-600 hover:underline ml-1">Upgrade to add more.</button>
                </p>
              </div>
            )}
          </Card>

          {/* Selected Business Settings */}
          <Card className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-outfit text-slate-900">
                {selectedBusiness.name} Settings
              </h3>
              {!isEditingBusiness && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsEditingBusiness(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-slate-700">Business Name</Label>
                <Input
                  id="businessName"
                  value={selectedBusiness.name}
                  onChange={(e) => handleUpdateBusiness('name', e.target.value)}
                  disabled={!isEditingBusiness}
                  className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription" className="text-slate-700">Description</Label>
                <Textarea
                  id="businessDescription"
                  value={selectedBusiness.description}
                  onChange={(e) => handleUpdateBusiness('description', e.target.value)}
                  disabled={!isEditingBusiness}
                  className="min-h-20 border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="text-slate-700">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={selectedBusiness.websiteUrl}
                    onChange={(e) => handleUpdateBusiness('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                    disabled={!isEditingBusiness}
                    className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramHandle" className="text-slate-700">Instagram Handle</Label>
                  <Input
                    id="instagramHandle"
                    value={selectedBusiness.instagramHandle}
                    onChange={(e) => handleUpdateBusiness('instagramHandle', e.target.value)}
                    placeholder="@yourbusiness"
                    disabled={!isEditingBusiness}
                    className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brandColor" className="text-slate-700">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brandColor"
                      type="color"
                      value={selectedBusiness.brandColor}
                      onChange={(e) => handleUpdateBusiness('brandColor', e.target.value)}
                      disabled={!isEditingBusiness}
                      className="w-16 h-10 p-1 cursor-pointer border-slate-200 bg-white/90 disabled:cursor-not-allowed"
                    />
                    <Input
                      value={selectedBusiness.brandColor}
                      onChange={(e) => handleUpdateBusiness('brandColor', e.target.value)}
                      placeholder="#3b82f6"
                      disabled={!isEditingBusiness}
                      className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-700">Location</Label>
                  <Input
                    id="location"
                    value={selectedBusiness.location}
                    onChange={(e) => handleUpdateBusiness('location', e.target.value)}
                    placeholder="City, Country"
                    disabled={!isEditingBusiness}
                    className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                  />
                </div>
              </div>

              {isEditingBusiness && (
                <Button
                  className="gradient-blue-primary text-white hover:opacity-90 shadow-sm"
                  onClick={handleSaveBusiness}
                >
                  Save Changes
                </Button>
              )}

              {isSavingBusiness && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4">
                  <div className="text-sm  text-slate-700">Updating client info</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-outfit text-slate-900">Personal Information</h3>
              {!isEditingPersonal && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsEditingPersonal(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                  <Input
                    id="firstName"
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                    disabled={!isEditingPersonal}
                    className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
                  <Input
                    id="lastName"
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                    disabled={!isEditingPersonal}
                    className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  disabled={!isEditingPersonal}
                  className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  disabled={!isEditingPersonal}
                  className="border-slate-200 bg-white/90 disabled:bg-slate-100/70 disabled:text-slate-500"
                />
              </div>

              {isEditingPersonal && (
                <Button
                  className="gradient-blue-primary text-white hover:opacity-90 shadow-sm"
                  onClick={handleSavePersonal}
                >
                  Save Changes
                </Button>
              )}

              {isSavingPersonal && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4">
                  <div className="text-sm  text-slate-700">Updating client info</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
            <h3 className="text-lg font-outfit text-slate-900 mb-4">Security</h3>
            <div className="space-y-4">
              <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                Change Password
              </Button>
              <div className="pt-4 border-t border-slate-200">
                <Button variant="destructive" className="bg-rose-600 hover:bg-rose-700">
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
            <h3 className="text-lg font-outfit text-slate-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className=" text-slate-900">Email Notifications</div>
                  <p className="text-sm text-slate-600">Receive updates via email</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className=" text-slate-900">Post Reminders</div>
                  <p className="text-sm text-slate-600">Get reminded before posts go live</p>
                </div>
                <Switch
                  checked={notifications.postReminders}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, postReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className=" text-slate-900">Weekly Reports</div>
                  <p className="text-sm text-slate-600">Receive weekly performance summaries</p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, weeklyReports: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className=" text-slate-900">AI Suggestions</div>
                  <p className="text-sm text-slate-600">Get AI-powered content recommendations</p>
                </div>
                <Switch
                  checked={notifications.aiSuggestions}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, aiSuggestions: checked })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
            <h3 className="text-2xl font-outfit text-slate-900">Current Plan:</h3>
            <div className="space-y-4">
              <div className="flex items-start justify-between ml-8">
                <div>
                  <div className="text-xl font-outfit text-slate-900">{currentPlan.name} Plan</div>
                  <p className="text-slate-600 mt-1">{currentPlan.type}</p>
                  <ul className="mt-3 space-y-2">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-blue-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-outfit text-slate-900">${currentPlan.price}</div>
                  <div className="text-sm text-slate-600">per month</div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 ml-8">
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsPlanModalOpen(true)}
                >
                  Change Plan
                </Button>
                <Button variant="outline" className="border-slate-200 text-rose-600 hover:bg-rose-50">
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
            <h3 className="text-lg font-outfit text-slate-900 mb-4">Payment Method</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg bg-white/90">
                <CreditCard className="w-8 h-8 text-slate-400" />
                <div className="flex-1">
                  <div className=" text-slate-900">•••• •••• •••• {MOCK_PAYMENT_METHOD.last4}</div>
                  <p className="text-sm text-slate-600">Expires {MOCK_PAYMENT_METHOD.expiryMonth}/{MOCK_PAYMENT_METHOD.expiryYear}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  Update
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        </Tabs>

        <AddBusinessModal
          open={isAddBusinessOpen}
          onOpenChange={setIsAddBusinessOpen}
          value={{
            name: newBusiness.name || '',
            description: newBusiness.description || '',
            websiteUrl: newBusiness.websiteUrl || '',
            instagramHandle: newBusiness.instagramHandle || '',
            brandColor: newBusiness.brandColor || '#3b82f6',
            location: newBusiness.location || ''
          }}
          onChange={(updates) => setNewBusiness({ ...newBusiness, ...updates })}
          onSubmit={handleAddBusiness}
        />
        <PlanSelectionModal
          open={isPlanModalOpen}
          onOpenChange={setIsPlanModalOpen}
          currentPlanId={currentPlanId}
          onSelectPlan={() => setIsPlanModalOpen(false)}
        />
        <PaymentMethodModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
        />
      </div>
    </div>
  );
}
