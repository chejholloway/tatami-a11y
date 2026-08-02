import { useState, useRef, useEffect } from 'react';
import { Toast, Dropdown } from 'tatami-a11y';
import { tatami } from '../../adapters/tatami.js';
import './App.css';

function ToastNaiveTest() {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState('Idle');

  const handleShowToast = () => {
    Toast.show('Naive toast message', { variant: 'info' });
    setResult('Toast shown');
  };

  const handleRerender = () => {
    setCount((c) => c + 1);
    setTimeout(() => {
      const toastEl = document.querySelector('.toast');
      if (toastEl && toastEl.isConnected) {
        setResult('PASS: Toast survived re-render (naive)');
      } else {
        setResult('FAIL: Toast removed from DOM after re-render');
      }
    }, 100);
  };

  return (
    <div className="test-section">
      <h3>Toast — Naive (no wrapper)</h3>
      <button onClick={handleShowToast}>Show Toast</button>
      <button onClick={handleRerender}>Re-render (count: {count})</button>
      <p className="result">{result}</p>
    </div>
  );
}

function ToastWrapperTest() {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState('Idle');
  const toastContainerRef = useRef(null);

  useEffect(() => {
    if (toastContainerRef.current) {
      const wrapper = document.createElement('div');
      wrapper.className = 'toast-wrapper';
      toastContainerRef.current.appendChild(wrapper);
      return () => {
        wrapper.remove();
      };
    }
  }, []);

  const handleShowToast = () => {
    Toast.show('Wrapper toast message', { variant: 'success' });
    setResult('Toast shown');
  };

  const handleRerender = () => {
    setCount((c) => c + 1);
    setTimeout(() => {
      const toastEl = document.querySelector('.toast');
      if (toastEl && toastEl.isConnected) {
        setResult('PASS: Toast survived re-render (wrapper)');
      } else {
        setResult('FAIL: Toast removed from DOM after re-render');
      }
    }, 100);
  };

  return (
    <div className="test-section">
      <h3>Toast — Wrapper (ref + useEffect)</h3>
      <div ref={toastContainerRef} />
      <button onClick={handleShowToast}>Show Toast</button>
      <button onClick={handleRerender}>Re-render (count: {count})</button>
      <p className="result">{result}</p>
    </div>
  );
}

function DropdownNaiveTest() {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState('Idle');
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (triggerRef.current && menuRef.current && !dropdownRef.current) {
      dropdownRef.current = new Dropdown({
        trigger: triggerRef.current,
        menu: menuRef.current,
      });
    }
  }, []);

  const handleOpen = () => {
    try {
      dropdownRef.current?.open();
      setResult('Dropdown opened');
    } catch (e) {
      setResult('ERROR on open: ' + e.message);
    }
  };

  const handleRerender = () => {
    setCount((c) => c + 1);
    setTimeout(() => {
      try {
        dropdownRef.current?.open();
        const menu = menuRef.current;
        if (menu && menu.getAttribute('aria-hidden') === 'false') {
          setResult('PASS: Dropdown works after re-render (naive)');
        } else {
          setResult('FAIL: Dropdown menu not openable after re-render');
        }
      } catch (e) {
        setResult('FAIL ERROR: ' + e.message);
      }
    }, 100);
  };

  return (
    <div className="test-section">
      <h3>Dropdown — Naive (no wrapper)</h3>
      <button ref={triggerRef}>Trigger</button>
      <div ref={menuRef}>
        <div role="menuitem">Item 1</div>
        <div role="menuitem">Item 2</div>
      </div>
      <button onClick={handleOpen}>Open Dropdown</button>
      <button onClick={handleRerender}>Re-render (count: {count})</button>
      <p className="result">{result}</p>
    </div>
  );
}

function DropdownWrapperTest() {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState('Idle');
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const ctrlRef = useRef(null);

  useEffect(() => {
    // tatami() replaces the manual new Dropdown() + destroy() boilerplate.
    // Works for any tatami-a11y component — same three lines every time.
    ctrlRef.current = tatami(Dropdown, {
      trigger: triggerRef.current,
      menu: menuRef.current,
    });
    return () => ctrlRef.current.destroy();
  }, []);

  const handleOpen = () => {
    try {
      ctrlRef.current?.open();
      setResult('Dropdown opened');
    } catch (e) {
      setResult('ERROR on open: ' + e.message);
    }
  };

  const handleRerender = () => {
    setCount((c) => c + 1);
    setTimeout(() => {
      try {
        ctrlRef.current?.open();
        const menu = menuRef.current;
        if (menu && menu.getAttribute('aria-hidden') === 'false') {
          setResult('PASS: Dropdown works after re-render (tatami() wrapper)');
        } else {
          setResult('FAIL: Dropdown menu not openable after re-render');
        }
      } catch (e) {
        setResult('FAIL ERROR: ' + e.message);
      }
    }, 100);
  };

  return (
    <div className="test-section">
      <h3>Dropdown — Wrapper (mount() utility)</h3>
      <button ref={triggerRef}>Trigger</button>
      <div ref={menuRef}>
        <div role="menuitem">Item 1</div>
        <div role="menuitem">Item 2</div>
      </div>
      <button onClick={handleOpen}>Open Dropdown</button>
      <button onClick={handleRerender}>Re-render (count: {count})</button>
      <p className="result">{result}</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="app">
      <h1>React — Framework Interop Test</h1>
      <ToastNaiveTest />
      <ToastWrapperTest />
      <DropdownNaiveTest />
      <DropdownWrapperTest />
    </div>
  );
}