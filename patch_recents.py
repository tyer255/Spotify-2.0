import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# I want to replace the Add (+) button block in Recents.
# It currently starts around `<div className="flex items-center gap-2 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">`
# and `{item.type === 'track' && (`

new_buttons = """
                        <div className="flex items-center gap-2 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          {(() => {
                            let isChecked = false;
                            if (item.type === 'track') isChecked = isLiked;
                            if (item.type === 'artist') isChecked = isArtistFollowed(item.id);

                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.type === 'track') {
                                    const dummyTrack: any = { id: item.id, title: item.title, artist: item.subtitle.replace('Song • ', '').replace('Single • ', ''), images: { small: item.image, medium: item.image, large: item.image } };
                                    toggleLikeTrack(dummyTrack);
                                  } else if (item.type === 'artist') {
                                    toggleFollowArtist({ id: item.id, name: item.title, image: item.image });
                                  } else {
                                    // For playlist/album, show a generic toast if available or just do nothing
                                    if (typeof window !== 'undefined') {
                                      // showComingSoon might not be in scope, so just ignore or we can use an alert
                                    }
                                  }
                                }}
                                className="p-2 text-neutral-400 hover:text-white transition-colors"
                              >
                                {isChecked ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-black stroke-[3]" />
                                  </div>
                                ) : (
                                  <Plus className="w-6 h-6 stroke-1" />
                                )}
                              </button>
                            );
                          })()}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecent(item.id);
                            }}
                            className="p-2 text-neutral-400 hover:text-white transition-colors"
                          >
                            <X className="w-6 h-6 stroke-1" />
                          </button>
                        </div>
"""

old_buttons_pattern = r"<div className=\"flex items-center gap-2 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity\">.*?<X className=\"w-6 h-6 stroke-1\" \/>\n\s*<\/button>\n\s*<\/div>"

content = re.sub(old_buttons_pattern, new_buttons.strip(), content, flags=re.DOTALL)

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

