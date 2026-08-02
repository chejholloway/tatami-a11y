import { useEffect, useRef } from 'react';

export function ReactModalIsland() {
  const triggerRef = useRef(null);
  const modalRef = useRef(null);
  const ctrlRef = useRef(null);

  useEffect(() => {
    if (triggerRef.current && modalRef.current && !ctrlRef.current) {
      import('tatami-a11y/adapters/tatami.js').then(({ tatami }) => {
        import('tatami-a11y').then(({ Modal }) => {
          ctrlRef.current = tatami(Modal, { trigger: triggerRef.current, modal: modalRef.current });
        });
      });
    }
    return () => {
      if (ctrlRef.current) {
        ctrlRef.current.destroy();
        ctrlRef.current = null;
      }
    };
  }, []);

  return (
    <div className="island" data-framework="react">
      <button ref={triggerRef} onClick={() => ctrlRef.current?.open()} style={{ marginBottom: '2rem' }}>
        Open Modal (React)
      </button>
      <div ref={modalRef} className="modal" role="dialog" aria-modal="true" hidden>
        <p>React modal content</p>
        <button onClick={() => ctrlRef.current?.close()} style={{ marginTop: '1rem' }}>Close</button>
      </div>
      <button onClick={() => {
        import('tatami-a11y').then(({ Toast }) => {
          Toast.show('Toast from React island', { variant: 'success' });
        });
      }} style={{ marginTop: '2rem' }}>
        Toast from React
      </button>
    </div>
  );
}