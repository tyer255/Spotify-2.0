with open('src/components/Common/ClonePlaylistModal.tsx', 'r') as f:
    content = f.read()

old_err = """        const errMsg = !res.data?.tracks?.length
          ? 'No tracks found in this playlist. Please ensure the playlist is public.'
          : (typeof res.error === 'string' ? res.error : (res.error?.message || 'Failed to import playlist. Make sure it is public.'));"""

new_err = """        let errMsg = 'Failed to import playlist. Make sure it is public.';
        if (!res.success) {
          errMsg = typeof res.error === 'string' ? res.error : (res.error?.message || errMsg);
        } else if (!res.data?.tracks?.length) {
          errMsg = 'No tracks found in this playlist. Please ensure the playlist is public.';
        }"""

content = content.replace(old_err, new_err)

with open('src/components/Common/ClonePlaylistModal.tsx', 'w') as f:
    f.write(content)
