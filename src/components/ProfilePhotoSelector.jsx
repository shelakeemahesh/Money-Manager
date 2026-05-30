import { useRef, useState, useEffect } from "react";
import { User, Camera, Trash } from "lucide-react";

const ProfilePhotoSelector = ({ image, setImage, currentImage }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (image) {
      const preview = URL.createObjectURL(image);
      setPreviewUrl(preview);
      return () => URL.revokeObjectURL(preview);
    } else {
      setPreviewUrl(null);
    }
  }, [image]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImage(null);
    setPreviewUrl(null);
  };

  const onChooseFile = (e) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="flex justify-center">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      <div 
        className="relative group cursor-pointer"
        onClick={!displayImage ? onChooseFile : undefined}
      >
        {!displayImage ? (
          /* Placeholder / Empty State (Premium Glassmorphic Design) */
          <div className="w-[88px] h-[88px] flex items-center justify-center bg-[var(--surface-3)] border border-[var(--border)] rounded-full transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] relative">
            <User className="text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors duration-300" size={32} />

            <div
              onClick={(e) => {
                e.stopPropagation();
                onChooseFile(e);
              }}
              className="w-7 h-7 flex items-center justify-center bg-[var(--brand)] text-[var(--surface)] rounded-full absolute -bottom-0.5 -right-0.5 shadow-md border border-[var(--border)] transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600"
            >
              <Camera size={13} className="text-[var(--surface)]" />
            </div>
          </div>
        ) : (
          /* Active Selected Image or Current User Avatar State */
          <div className="w-[88px] h-[88px] rounded-full overflow-hidden border border-[var(--border)] relative transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-500/50 shadow-sm">
            <img
              src={displayImage}
              alt="profile photo"
              className="w-full h-full object-cover"
            />

            {/* Premium Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
              <div className="flex gap-2">
                {/* Change photo button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChooseFile(e);
                  }}
                  title="Change Photo"
                  className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
                >
                  <Camera size={13} />
                </button>
                {/* Delete photo button */}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  title="Remove Photo"
                  className="p-1.5 rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/80 hover:text-white transition-colors cursor-pointer"
                >
                  <Trash size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePhotoSelector;