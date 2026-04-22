import React, { useState } from 'react';
import { Shield, UserCog, Search, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { useApp, UserRole, User } from '../../store/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';

export const ROLE_NAMES: Record<UserRole, string> = {
  admin: 'Quản trị viên (Admin)',
  staff: 'Nhân viên y tế (Staff)',
  organizer: 'Đơn vị tổ chức (Organizer)',
  donor: 'Người hiến máu (Donor)'
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Toàn quyền quản trị hệ thống, quản lý người dùng và phân quyền.',
  staff: 'Nhân viên y tế, quản lý sự kiện, điểm danh người tham gia, cập nhật tồn kho máu.',
  organizer: 'Tạo và quản lý sự kiện do mình tổ chức, xem báo cáo sự kiện.',
  donor: 'Người dùng bình thường, xem sự kiện, đăng ký hiến máu.'
};

const modules = [
  { id: 'events', name: 'Sự kiện' },
  { id: 'participants', name: 'Người tham gia' },
  { id: 'donors', name: 'Người hiến máu' },
  { id: 'inventory', name: 'Tồn kho máu' },
  { id: 'reports', name: 'Báo cáo & Thống kê' },
  { id: 'system', name: 'Hệ thống (Phân quyền)' },
  { id: 'rewards', name: 'Phần thưởng' },
  { id: 'locations', name: 'Địa điểm' }
];

export const AdminRoles: React.FC = () => {
  const { users, updateUser, currentUser, rolePermissions, updateRolePermissions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || user.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      toast.error('Bạn không thể tự thay đổi quyền của chính mình!');
      return;
    }
    updateUser(userId, { role: newRole });
    toast.success('Cập nhật quyền thành công!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-600" />
          Phân quyền tài khoản
        </h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý vai trò của người dùng và cấu trúc quyền hạn trong hệ thống.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-600 py-2.5 px-4 flex-1 min-w-[150px]">
            <UserCog className="w-4 h-4 mr-2" />
            Cấp quyền người dùng
          </TabsTrigger>
          <TabsTrigger value="permissions" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 py-2.5 px-4 flex-1 min-w-[150px]">
            <Shield className="w-4 h-4 mr-2" />
            Cấu trúc phân quyền
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên hoặc email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button 
                variant={selectedRoleFilter === 'all' ? 'default' : 'outline'} 
                onClick={() => setSelectedRoleFilter('all')}
                className="whitespace-nowrap"
              >
                Tất cả
              </Button>
              {(Object.keys(ROLE_NAMES) as UserRole[]).map(role => (
                <Button 
                  key={role}
                  variant={selectedRoleFilter === role ? 'default' : 'outline'} 
                  onClick={() => setSelectedRoleFilter(role)}
                  className="whitespace-nowrap"
                >
                  {ROLE_NAMES[role]}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò hiện tại</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cấp quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                              alt={user.name} 
                              className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200"
                            />
                            <span className="font-bold text-slate-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'organizer' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {ROLE_NAMES[user.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            disabled={user.id === currentUser?.id}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {(Object.keys(ROLE_NAMES) as UserRole[]).map(role => (
                              <option key={role} value={role}>{ROLE_NAMES[role]}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        Không tìm thấy người dùng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Cấu trúc phân quyền (Role-Based Access Control)</p>
              <p>Hệ thống sử dụng mô hình phân quyền dựa trên vai trò. Bạn có thể tùy chỉnh quyền hạn cho từng vai trò (ngoại trừ Admin) bằng cách tích chọn vào các ô tương ứng.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(ROLE_NAMES) as UserRole[]).filter(r => r !== 'donor').map(role => (
              <div key={role} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  role === 'admin' ? 'bg-purple-500' :
                  role === 'staff' ? 'bg-blue-500' :
                  'bg-amber-500'
                }`} />
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${
                    role === 'admin' ? 'bg-purple-50 text-purple-600' :
                    role === 'staff' ? 'bg-blue-50 text-blue-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {role === 'admin' ? <Shield className="w-6 h-6" /> :
                     role === 'staff' ? <UserCog className="w-6 h-6" /> :
                     <UserCog className="w-6 h-6" />}
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">
                    {ROLE_NAMES[role].split(' (')[0]}
                    <span className="block text-xs font-normal text-slate-500">{ROLE_NAMES[role].split(' (')[1]?.replace(')', '')}</span>
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mb-6 min-h-[40px]">{ROLE_DESCRIPTIONS[role]}</p>
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quyền hạn</div>
                  {rolePermissions[role].includes('all') ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium bg-emerald-50/80 border border-emerald-100 p-3 rounded-xl">
                      <Check className="w-5 h-5 text-emerald-500" /> Toàn quyền hệ thống
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {rolePermissions[role].length > 0 ? rolePermissions[role].map(perm => (
                        <span key={perm} className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                          {perm}
                        </span>
                      )) : (
                        <span className="text-sm text-slate-400 italic">Chưa có quyền nào</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Ma trận phân quyền chi tiết</h3>
                <p className="text-sm text-slate-500 mt-1">Tùy chỉnh quyền truy cập cho từng module trong hệ thống</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 border-r border-slate-200 w-1/3">Module / Chức năng</th>
                    <th className="px-6 py-4 text-center border-r border-slate-200 w-2/9">Admin</th>
                    <th className="px-6 py-4 text-center border-r border-slate-200 w-2/9">Staff</th>
                    <th className="px-6 py-4 text-center w-2/9">Organizer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map((module) => (
                    <React.Fragment key={module.id}>
                      <tr className="bg-slate-50/50">
                        <td className="px-6 py-3 font-bold text-slate-800 border-r border-slate-200" colSpan={4}>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            {module.name}
                          </div>
                        </td>
                      </tr>
                      {['read', 'write', 'delete'].map(action => {
                        const permString = `${module.id}.${action}`;
                        return (
                          <tr key={permString} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-3 pl-10 text-slate-600 border-r border-slate-200 font-medium">
                              {action === 'read' ? 'Xem (Read)' : action === 'write' ? 'Thêm/Sửa (Write)' : 'Xóa (Delete)'}
                            </td>
                            {(Object.keys(ROLE_NAMES) as UserRole[]).filter(r => r !== 'donor').map(role => {
                              const hasPerm = rolePermissions[role].includes('all') || rolePermissions[role].includes(permString);
                              const isEditable = role !== 'admin';
                              return (
                                <td key={role} className="px-6 py-3 text-center border-r border-slate-200 last:border-0">
                                  {isEditable ? (
                                    <label className="inline-flex items-center justify-center cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                      <input 
                                        type="checkbox" 
                                        checked={hasPerm}
                                        onChange={(e) => {
                                          const newPerms = e.target.checked 
                                            ? [...new Set([...rolePermissions[role], permString])]
                                            : rolePermissions[role].filter(p => p !== permString);
                                          updateRolePermissions(role, newPerms);
                                          toast.success(`Đã cập nhật quyền cho ${ROLE_NAMES[role]}`);
                                        }}
                                        className="w-5 h-5 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer transition-all"
                                      />
                                    </label>
                                  ) : (
                                    <div className="flex justify-center p-2">
                                      {hasPerm ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-slate-300" />}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
