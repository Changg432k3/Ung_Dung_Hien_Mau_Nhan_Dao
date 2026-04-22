import React, { useState, useRef } from 'react';
import { useApp, CertificateTemplate } from '../../store/AppContext';
import { Plus, Edit2, Trash2, Users, FileText, Image as ImageIcon, Calendar, Copy, Eye, EyeOff, Search, RefreshCw, XCircle, Download, Heart, Activity, Star, Zap, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'react-qr-code';

import { ConfirmationModal } from '../../components/ConfirmationModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

const ICON_MAP: Record<string, React.ElementType> = {
  Heart,
  Activity,
  Star,
  Zap,
  Users,
  Shield,
  FileText
};

const COLOR_MAP: Record<string, { bg: string, text: string, border: string }> = {
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  default: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
};

export const AdminCertificates: React.FC = () => {
  const { certificateTemplates, addCertificateTemplate, updateCertificateTemplate, deleteCertificateTemplate, duplicateTemplate, toggleTemplateStatus, certificates, events, users, revokeCertificate, regenerateCertificate } = useApp();
  const [activeTab, setActiveTab] = useState<'templates' | 'issued' | 'stats'>('templates');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [formData, setFormData] = useState<Partial<CertificateTemplate>>({
    name: '',
    backgroundUrl: '',
    title: '',
    content: '',
    signatureUrl: '',
    logoUrl: '',
    signerName: '',
    signerTitle: '',
    stampUrl: '',
    enableQR: true,
    status: 'active',
    fontStyle: 'serif',
    eventId: '',
    minDonations: 0
  });

  const handleOpenModal = (template?: CertificateTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        backgroundUrl: template.backgroundUrl,
        title: template.title,
        content: template.content,
        signatureUrl: template.signatureUrl,
        logoUrl: template.logoUrl || '',
        signerName: template.signerName || '',
        signerTitle: template.signerTitle || '',
        stampUrl: template.stampUrl || '',
        enableQR: template.enableQR !== false,
        status: template.status || 'active',
        fontStyle: template.fontStyle || 'serif',
        eventId: template.eventId || '',
        minDonations: template.minDonations || 0
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        backgroundUrl: '',
        title: '',
        content: '',
        signatureUrl: '',
        logoUrl: '',
        signerName: '',
        signerTitle: '',
        stampUrl: '',
        enableQR: true,
        status: 'active',
        fontStyle: 'serif',
        eventId: '',
        minDonations: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const certificateRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${formData.name || 'certificate-preview'}.pdf`);
    } catch (error) {
      console.error('Lỗi khi tải PDF chứng nhận:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateCertificateTemplate(editingTemplate.id, formData);
    } else {
      addCertificateTemplate(formData as Omit<CertificateTemplate, 'id'>);
    }
    handleCloseModal();
  };

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{type: 'revoke' | 'regenerate', id: string} | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteCertificateTemplate(deletingId);
      setIsConfirmDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'revoke') {
      revokeCertificate(confirmAction.id);
    } else if (confirmAction.type === 'regenerate') {
      regenerateCertificate(confirmAction.id);
    }
    
    setConfirmAction(null);
  };

  const getIssuedCount = (templateId: string) => {
    return certificates.filter(c => c.templateId === templateId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Chứng nhận</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý mẫu chứng nhận và danh sách đã cấp phát.</p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('templates')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'templates'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="text-lg">🏅</span> Danh sách các loại chứng nhận
          </button>
          <button
            onClick={() => setActiveTab('issued')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'issued'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="text-lg">👥</span> Danh sách đã cấp
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="text-lg">📈</span> Thống kê theo sự kiện
          </button>
        </nav>
      </div>

      {activeTab === 'templates' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificateTemplates.map((template, index) => {
            const IconComponent = template.icon && ICON_MAP[template.icon] ? ICON_MAP[template.icon] : FileText;
            const colorTheme = template.color && COLOR_MAP[template.color] ? COLOR_MAP[template.color] : COLOR_MAP.default;

            return (
              <motion.div
                key={`${template.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white rounded-2xl border ${colorTheme.border} shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow`}
              >
                <div className={`h-32 w-full ${colorTheme.bg} flex items-center justify-center border-b ${colorTheme.border}`}>
                  <IconComponent className={`w-16 h-16 ${colorTheme.text} opacity-80`} />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className={`text-lg font-bold ${colorTheme.text} mb-2`}>{template.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex-1 line-clamp-3">{template.content || 'Chưa có mô tả chi tiết cho loại chứng nhận này.'}</p>
                  <div className="flex items-center justify-end mt-auto pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleOpenModal(template)}
                      className={`text-sm font-medium flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${colorTheme.bg} ${colorTheme.text} hover:opacity-80`}
                    >
                      <Eye className="w-4 h-4" /> Xem chi tiết
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {certificateTemplates.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
              <p className="text-slate-500">Chưa có mẫu chứng nhận nào.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'issued' ? (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm kiếm theo tên người nhận..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select 
                className="p-2 rounded-lg border border-slate-200 outline-none focus:border-red-500 bg-slate-50 flex-1 md:flex-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tất cả loại chứng nhận</option>
                {certificateTemplates.map((t, index) => (
                  <option key={`${t.id}-${index}`} value={t.id}>{t.name}</option>
                ))}
              </select>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="p-2 rounded-lg border border-slate-200 outline-none focus:border-red-500 bg-slate-50 flex-1 md:flex-none"
              />
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-medium transition-colors border border-emerald-200"
                onClick={() => alert('Chức năng xuất Excel đang được phát triển')}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">👤 Người nhận</th>
                    <th className="px-6 py-4">🏅 Loại chứng nhận</th>
                    <th className="px-6 py-4">📅 Ngày cấp</th>
                    <th className="px-6 py-4">📍 Sự kiện</th>
                    <th className="px-6 py-4 text-right">🔍 Xem chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificates.filter(cert => {
                    const user = users.find(u => u && u.id === cert.userId);
                    const searchLower = searchQuery.toLowerCase();
                    const matchesSearch = (user?.name?.toLowerCase() || '').includes(searchLower);
                    const matchesType = filterType === 'all' || cert.templateId === filterType;
                    const matchesDate = !filterDate || (cert.issueDate && cert.issueDate.startsWith(filterDate));
                    return matchesSearch && matchesType && matchesDate;
                  }).length > 0 ? (
                    certificates.filter(cert => {
                      const user = users.find(u => u && u.id === cert.userId);
                      const searchLower = searchQuery.toLowerCase();
                      const matchesSearch = (user?.name?.toLowerCase() || '').includes(searchLower);
                      const matchesType = filterType === 'all' || cert.templateId === filterType;
                      const matchesDate = !filterDate || (cert.issueDate && cert.issueDate.startsWith(filterDate));
                      return matchesSearch && matchesType && matchesDate;
                    }).map((cert, index) => {
                      const user = users.find(u => u && u.id === cert.userId);
                      const event = events.find(e => e && e.id === cert.eventId);
                      const template = certificateTemplates.find(t => t.id === cert.templateId);
                      return (
                        <tr key={`${cert.id}-${index}`} className={`hover:bg-slate-50 transition-colors ${cert.status === 'revoked' ? 'opacity-60 bg-slate-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={user?.avatar || undefined} alt={user?.name || 'User'} className="w-8 h-8 rounded-full bg-slate-200" />
                              <div>
                                <p className="font-medium text-slate-900">{user?.name || 'Người dùng không tên'}</p>
                                <p className="text-xs text-slate-500">{user?.email || 'Không có email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{template?.name || 'Không xác định'}</td>
                          <td className="px-6 py-4">{cert.issueDate && !isNaN(new Date(cert.issueDate).getTime()) ? new Date(cert.issueDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</td>
                          <td className="px-6 py-4">{event?.title || 'Sự kiện không xác định'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                onClick={() => window.open(`/verify/${cert.id}`, '_blank')}
                                title="Xem chứng nhận"
                              >
                                <Eye className="w-4 h-4" /> <span className="text-xs font-medium">Xem</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        {searchQuery ? 'Không tìm thấy chứng nhận nào phù hợp.' : 'Chưa có chứng nhận nào được cấp.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng chứng nhận đã cấp</p>
                <p className="text-2xl font-bold text-slate-900">{certificates.filter(c => c.status !== 'revoked').length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Số sự kiện đã cấp chứng nhận</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(certificates.filter(c => c.status !== 'revoked').map(c => c.eventId)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Số chứng nhận theo sự kiện */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Số chứng nhận theo sự kiện</h3>
              <div className="h-[300px] w-full">
                {(() => {
                  const validCerts = certificates.filter(c => c.status !== 'revoked');
                  const statsByEvent = validCerts.reduce((acc, cert) => {
                    const event = events.find(e => e.id === cert.eventId);
                    const eventName = event ? event.title : 'Sự kiện không xác định';
                    acc[eventName] = (acc[eventName] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const data = Object.entries(statsByEvent)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5); // Show top 5 events

                  if (data.length === 0) {
                    return <div className="h-full flex items-center justify-center text-slate-500">Chưa có dữ liệu</div>;
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" name="Số lượng" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Pie Chart: Tỷ lệ theo loại chứng nhận */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Tỷ lệ theo loại chứng nhận</h3>
              <div className="h-[300px] w-full">
                {(() => {
                  const validCerts = certificates.filter(c => c.status !== 'revoked');
                  const statsByType = validCerts.reduce((acc, cert) => {
                    const template = certificateTemplates.find(t => t.id === cert.templateId);
                    const typeName = template ? template.name : 'Không xác định';
                    acc[typeName] = (acc[typeName] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const data = Object.entries(statsByType).map(([name, value]) => ({ name, value }));

                  if (data.length === 0) {
                    return <div className="h-full flex items-center justify-center text-slate-500">Chưa có dữ liệu</div>;
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Chi tiết theo loại chứng nhận</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Loại chứng nhận</th>
                    <th className="px-6 py-4 text-right">Số lượng đã cấp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificateTemplates.map((template, index) => {
                    const count = getIssuedCount(template.id);
                    if (count === 0) return null;
                    return (
                      <tr key={`${template.id}-${index}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{template.name}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{count}</td>
                      </tr>
                    );
                  })}
                  {certificates.filter(c => c.status !== 'revoked').length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                        Chưa có dữ liệu thống kê.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[32px] bg-white shadow-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-5 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  Xem chứng nhận
                </h2>
                <p className="text-sm text-slate-500 mt-1">Ảnh xem trước theo phong cách giấy chứng nhận thật, dễ xuất file PDF.</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6 p-6 overflow-y-auto max-h-[calc(95vh-90px)]">
              <div className="flex items-center justify-center min-h-[40rem]">
                <div ref={certificateRef} className="relative w-full max-w-4xl aspect-[4/3] rounded-[2rem] overflow-hidden border border-slate-200 bg-white shadow-[0_35px_80px_rgba(15,23,42,0.12)]" style={{ fontFamily: formData.fontStyle === 'mono' ? 'monospace' : formData.fontStyle === 'sans' ? 'system-ui, sans-serif' : 'Georgia, serif' }}>
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: formData.backgroundUrl
                        ? `url(${formData.backgroundUrl})`
                        : 'radial-gradient(circle at top left, rgba(226,232,240,0.25), transparent 25%), radial-gradient(circle at bottom right, rgba(226,232,240,0.3), transparent 22%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/90" />
                  <div className="pointer-events-none absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-70" />
                  <div className="pointer-events-none absolute inset-x-20 bottom-10 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-50" />
                  <div className="pointer-events-none absolute left-8 top-8 h-14 w-14 rounded-full border border-slate-300/70" />
                  <div className="pointer-events-none absolute right-8 bottom-8 h-14 w-14 rounded-full border border-slate-300/70" />
                  {formData.stampUrl && (
                    <img
                      src={formData.stampUrl}
                      alt="Con dấu"
                      className="pointer-events-none absolute right-10 top-10 h-32 w-32 object-contain opacity-85"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}

                  <div className="relative z-10 h-full p-10 flex flex-col justify-between text-slate-900">
                    <div className="flex flex-col gap-8">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          {formData.logoUrl && (
                            <img
                              src={formData.logoUrl}
                              alt="Logo"
                              className="h-20 w-20 rounded-2xl bg-white p-3 shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Giấy chứng nhận</p>
                            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-slate-900">{formData.title || 'GIẤY CHỨNG NHẬN'}</h1>
                          </div>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.3em] text-slate-500">
                          <p>{formData.name || 'Mẫu chứng nhận'}</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Trao tặng</p>
                        <p className="mt-4 text-5xl font-semibold uppercase leading-tight text-slate-900">{formData.name || 'Nguyễn Văn A'}</p>
                        <p className="mt-3 text-sm uppercase tracking-[0.25em] text-slate-500">{formData.signerTitle || 'Người hiến máu tiêu biểu'}</p>
                      </div>
                    </div>

                    <div className="mx-auto mt-10 max-w-3xl text-center text-base leading-8 text-slate-700 whitespace-pre-line text-justify">
                      {formData.content
                        ? formData.content
                            .replace(/\[Tên người hiến\]/g, formData.name || 'Nguyễn Văn A')
                            .replace(/\[Ngày sinh\]/g, '01/01/1990')
                            .replace(/\[Tên sự kiện\]/g, 'Ngày hội hiến máu 2024')
                            .replace(/\[Ngày hiến\]/g, '23/03/2026')
                            .replace(/\[Địa điểm\]/g, 'Bệnh viện Huyết học')
                            .replace(/\[Số lần hiến\]/g, '5')
                        : 'Chứng nhận được trao tặng vì những đóng góp quý giá trong hoạt động hiến máu tình nguyện. Xin trân trọng cảm ơn và chúc sức khỏe.'}
                    </div>

                    <div className="mt-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                      <div className="space-y-2 text-left">
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Người ký</p>
                        <p className="text-xl font-semibold text-slate-900">{formData.signerName || 'Nguyễn Thị Hồng'}</p>
                        <p className="text-sm text-slate-600">{formData.signerTitle || 'Ban Tổ Chức'}</p>
                      </div>
                      {formData.enableQR ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                          <QRCode
                            value={`${typeof window !== 'undefined' ? window.location.origin : 'https://apphienmau.netlify.app'}/verify/${editingTemplate?.id ?? 'preview'}`}
                            size={110}
                          />
                          <p className="mt-3 text-center text-[11px] uppercase tracking-[0.24em] text-slate-500">Quét để xác thực</p>
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 text-center text-xs text-slate-400">
                          QR code không được bật cho mẫu này
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Thông tin mẫu</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-800">Tên mẫu</p>
                      <p>{formData.name || 'Chưa có tên mẫu'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Tiêu đề chứng nhận</p>
                      <p>{formData.title || 'Chưa có tiêu đề'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Trạng thái</p>
                      <p className="text-slate-500 capitalize">{formData.status || 'active'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Font chữ xem trước</p>
                      <p className="capitalize">{formData.fontStyle || 'serif'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Hành động</h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                      <Download className="w-4 h-4" /> Tải PDF giấy chứng nhận
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Đóng
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Mẹo</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Sử dụng nút tải PDF để xuất nhanh giấy chứng nhận. Với ảnh nền thật và logo chuẩn, bản in sẽ trông giống giấy khen thực tế.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa mẫu chứng nhận này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />

      {/* Confirm Action Modal */}
      <ConfirmationModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'revoke' ? 'Xác nhận thu hồi' : 'Xác nhận cấp lại'}
        description={confirmAction?.type === 'revoke' 
          ? 'Bạn có chắc chắn muốn thu hồi chứng nhận này? Người dùng sẽ không thể sử dụng chứng nhận này nữa.' 
          : 'Bạn có chắc chắn muốn cấp lại chứng nhận này? Chứng nhận sẽ có hiệu lực trở lại.'}
        confirmText={confirmAction?.type === 'revoke' ? 'Thu hồi' : 'Cấp lại'}
        cancelText="Hủy"
        variant={confirmAction?.type === 'revoke' ? 'danger' : 'info'}
      />
    </div>
  );
};