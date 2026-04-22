import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { CheckCircle, XCircle, Download, Share2, Facebook, Twitter, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'react-qr-code';

export const VerifyCertificate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { certificates, certificateTemplates, users, events } = useApp();
  const [copied, setCopied] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const certificate = certificates.find(c => c.id === id);
  const template = certificate ? certificateTemplates.find(t => t.id === certificate.templateId) : null;
  const user = certificate ? users.find(u => u.id === certificate.userId) : null;
  const event = certificate ? events.find(e => e.id === certificate.eventId) : null;

  // A certificate is valid if it exists and has all required relations
  const isFound = !!(certificate && template && user && event);
  const isRevoked = certificate?.status === 'revoked';

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`ChungNhanHienMau_${user?.name || 'Máu+'}.pdf`);
    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error);
      alert('Đã xảy ra lỗi khi tải xuống PDF. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('download') === 'true' && isFound) {
      // Small delay to ensure images are loaded
      setTimeout(() => {
        handleDownloadPDF();
      }, 1000);
    }
  }, [location.search, isFound]);

  const shareUrl = window.location.href;
  const qrValue = JSON.stringify({ id: certificate?.id, url: shareUrl });
  const shareText = `Xem Giấy chứng nhận hiến máu tình nguyện của ${user?.name} trên Máu+! 🩸`;

  const handleShare = (platform: string) => {
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
    }
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  if (!isFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Chứng nhận không hợp lệ</h1>
          <p className="text-slate-600 mb-6">Không thể tìm thấy thông tin chứng nhận hoặc chứng nhận đã bị thu hồi.</p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Replace placeholders in content
  let parsedContent = template!.content;
  if (user) {
    parsedContent = parsedContent.replace(/\[Tên người hiến\]/g, user.name);
    parsedContent = parsedContent.replace(/\[Ngày sinh\]/g, '01/01/1990'); // Placeholder since user model doesn't have dob
    parsedContent = parsedContent.replace(/\[Số lần hiến\]/g, user.donationsCount.toString());
  }
  if (event) {
    parsedContent = parsedContent.replace(/\[Tên sự kiện\]/g, event.title);
    parsedContent = parsedContent.replace(/\[Địa điểm\]/g, event.location);
  }
  if (certificate) {
    parsedContent = parsedContent.replace(/\[Ngày hiến\]/g, certificate.issueDate && !isNaN(new Date(certificate.issueDate).getTime()) ? new Date(certificate.issueDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center text-slate-600 hover:text-red-600 font-medium transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Về trang chủ
          </Link>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isRevoked ? 'text-red-600 bg-red-50 border-red-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
            {isRevoked ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span className="font-medium">{isRevoked ? 'Chứng nhận đã bị thu hồi' : 'Chứng nhận hợp lệ'}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Certificate Render Area */}
          <div className="p-8 overflow-x-auto flex justify-center bg-slate-100 relative">
            <div 
              ref={certificateRef}
              className="relative bg-white shadow-md flex flex-col items-center justify-center p-8 text-center overflow-hidden"
              style={{ 
                width: '800px', 
                height: '565px', 
                backgroundImage: `url(${template!.backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay for better text readability if needed */}
              <div className="absolute inset-0 bg-white/80"></div>
              
              {/* Revoked Watermark */}
              {isRevoked && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                  <div className="transform -rotate-45 text-red-600/30 font-black text-9xl tracking-widest border-8 border-red-600/30 p-8 rounded-3xl">
                    ĐÃ THU HỒI
                  </div>
                </div>
              )}
              
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <h1 className="text-3xl font-black text-red-700 mb-8 uppercase tracking-wider" style={{ fontFamily: 'serif' }}>
                  {template!.title}
                </h1>
                
                <p 
                  className="text-xl text-slate-800 leading-relaxed max-w-2xl mb-12 whitespace-pre-wrap"
                  style={{ fontFamily: template!.fontStyle === 'serif' ? 'serif' : template!.fontStyle === 'mono' ? 'monospace' : 'sans-serif' }}
                >
                  {parsedContent}
                </p>

                <div className="mt-auto flex justify-between w-full px-12 items-end">
                  <div className="flex flex-col items-center">
                    {template!.logoUrl && (
                      <img 
                        src={template!.logoUrl} 
                        alt="Logo" 
                        className="h-16 object-contain mb-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {template!.enableQR && (
                      <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
                        <QRCode value={qrValue} size={80} />
                      </div>
                    )}
                    <p className="text-xs text-slate-500 font-mono mt-2">ID: {certificate!.id}</p>
                  </div>
                  
                  <div className="flex flex-col items-center relative">
                    {template!.stampUrl && (
                      <img 
                        src={template!.stampUrl} 
                        alt="Con dấu" 
                        className="h-24 w-24 object-contain absolute -left-12 top-0 opacity-80 mix-blend-multiply"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {template!.signatureUrl && (
                      <img 
                        src={template!.signatureUrl} 
                        alt="Chữ ký" 
                        className="h-16 object-contain mb-2 relative z-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {!template!.signatureUrl && <div className="h-16 mb-2"></div>}
                    <div className="w-40 border-t border-slate-800"></div>
                    <span className="text-sm text-slate-800 mt-2 font-bold">{template!.signerName || 'Đại diện Ban Tổ Chức'}</span>
                    <span className="text-xs text-slate-600 font-medium">{template!.signerTitle || ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => !isRevoked && handleShare('facebook')}
                disabled={isRevoked}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl transition-colors font-medium ${isRevoked ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#1877F2] hover:bg-[#1864D9]'}`}
              >
                <Facebook className="w-5 h-5" /> <span className="hidden sm:inline">Facebook</span>
              </button>
              <button 
                onClick={() => !isRevoked && handleShare('twitter')}
                disabled={isRevoked}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl transition-colors font-medium ${isRevoked ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#1DA1F2] hover:bg-[#1A91DA]'}`}
              >
                <Twitter className="w-5 h-5" /> <span className="hidden sm:inline">Twitter</span>
              </button>
              <button 
                onClick={() => !isRevoked && handleShare('copy')}
                disabled={isRevoked}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors font-medium relative ${isRevoked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {copied ? <span className="text-emerald-600 font-bold">Đã chép</span> : <><LinkIcon className="w-5 h-5" /> <span className="hidden sm:inline">Sao chép</span></>}
              </button>
            </div>
            
            <button 
              onClick={handleDownloadPDF}
              disabled={isRevoked}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-xl transition-colors font-bold shadow-sm ${isRevoked ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            >
              <Download className="w-5 h-5" /> Tải xuống PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
