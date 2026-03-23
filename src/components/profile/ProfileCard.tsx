import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, Heart, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileCardProps {
  id: string;
  name: string;
  age?: number | null;
  location?: string | null;
  bio?: string | null;
  avatar?: string | null;
  // Also accept 'image' alias used in Directory
  image?: string | null;
  interests?: string[] | null;
  tags?: string[];
  membershipTier?: string | null;
  verified?: boolean | null;
  compatibility?: number;
  mutualCompatibility?: number;
  matchReasons?: string[];
  isAIMatch?: boolean;
  lookingFor?: string;
  gender?: string | null;
  education?: string | null;
  career?: string | null;
  onLike?: (id: string) => void;
  onMessage?: (id: string) => void;
  onViewProfile?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function ProfileCard({
  id,
  name,
  age,
  location,
  bio,
  avatar,
  image,
  interests,
  tags,
  membershipTier,
  verified,
  compatibility,
  mutualCompatibility,
  matchReasons,
  isAIMatch,
  lookingFor,
  onLike,
  onMessage,
  onViewProfile,
  onClick,
}: ProfileCardProps) {
  const isPremium = membershipTier === 'premium' || membershipTier === 'elite';
  const photoSrc = image || avatar;
  const displayTags = tags || interests || [];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer"
      onClick={() => onClick?.(id)}
      data-testid={`profile-card-${id}`}
    >
      {/* Cover / Avatar area */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-purple-100">
        {compatibility !== undefined && (
          <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            <Sparkles className="w-3 h-3 inline mr-0.5" />
            {compatibility}%
          </div>
        )}
        {isPremium && (
          <div className="absolute top-3 left-3 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {membershipTier}
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="-mt-8 mb-3">
          <Avatar className="w-16 h-16 border-3 border-white shadow-md">
            <AvatarImage src={photoSrc || undefined} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name & info */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-bold text-gray-900 text-base">{name}{age ? `, ${age}` : ''}</span>
            {verified && <CheckCircle className="w-4 h-4 text-primary fill-primary/20 flex-shrink-0" />}
          </div>
          {location && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">{bio}</p>
        )}

        {/* Interests */}
        {interests && interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {interests.slice(0, 4).map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-0"
              >
                {interest}
              </Badge>
            ))}
            {interests.length > 4 && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 border-0">
                +{interests.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs rounded-full border-rose-200 text-rose-500 hover:bg-rose-50"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.(id);
            }}
          >
            <Heart className="w-3.5 h-3.5 mr-1.5" />
            Like
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onMessage?.(id);
            }}
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            Message
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
