import Icon from './icons';
import { Modal } from './ui';

const SHORTCUTS = [
  { key: '⌘ / Ctrl + K', desc: 'Mở bảng lệnh nhanh (Command Palette)' },
  { key: 'N', desc: 'Tạo công việc mới' },
  { key: '/', desc: 'Tìm kiếm nhanh công việc' },
  { key: '?', desc: 'Xem danh sách phím tắt' },
  { key: 'Esc', desc: 'Đóng hộp thoại hoặc hủy thao tác' },
  { key: 'Enter', desc: 'Xác nhận / Lưu thao tác' },
];

export default function ShortcutsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Phím tắt bàn phím" width={480}>
      <div className="shortcuts-list">
        {SHORTCUTS.map((s) => (
          <div key={s.key} className="shortcut-item">
            <span className="shortcut-item__desc">{s.desc}</span>
            <kbd className="shortcut-item__key">{s.key}</kbd>
          </div>
        ))}
      </div>
      <div className="row-end" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Đã hiểu
        </button>
      </div>
    </Modal>
  );
}
