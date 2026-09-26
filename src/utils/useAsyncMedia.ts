import { useState, useEffect } from 'react';
import { mediaCache } from '../services/mediaCache';

export function useAsyncMedia(src?: string | null) {
  const isLocal = Boolean(src && typeof src === 'string' && src.trim().startsWith('localmedia://'));
  const [resolvedSrc, setResolvedSrc] = useState<string>(
    isLocal ? '' : (src && typeof src === 'string' ? src.trim() : '')
  );
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(Boolean(isLocal));

  useEffect(() => {
    let objectUrl = '';
    let isMounted = true;

    if (!src || typeof src !== 'string' || src.trim() === '') {
      setResolvedSrc('');
      setError(false);
      setLoading(false);
      return;
    }

    const trimmedSrc = src.trim();

    if (trimmedSrc.startsWith('localmedia://')) {
      setLoading(true);
      const id = trimmedSrc.replace(/^localmedia:\/\/(video|image)\//, '');
      mediaCache.getMedia(id).then(blob => {
        if (!isMounted) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedSrc(objectUrl);
          setError(false);
        } else {
          setResolvedSrc('');
          setError(true);
        }
      }).catch(() => {
        if (isMounted) {
          setResolvedSrc('');
          setError(true);
        }
      }).finally(() => {
        if (isMounted) setLoading(false);
      });
    } else {
      setResolvedSrc(trimmedSrc);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return { resolvedSrc, error, loading };
}
