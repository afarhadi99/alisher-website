'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Search, X } from 'lucide-react';

export function QuickJump({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const destinations = [
    { name: 'The project explorer', href: '/#work', kind: 'Explore' },
    {
      name: 'Teaching and UFT recognition',
      href: '/#teaching',
      kind: 'Teaching',
    },
    { name: 'The blog', href: '/blog', kind: 'Writing' },
    {
      name: '3D and augmented reality',
      href: '/playground',
      kind: 'Experiment',
    },
    ...projects.map((project) => ({
      name: project.name,
      href: `/work/${project.id}`,
      kind: 'Project',
    })),
  ];
  const results = destinations
    .filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase().trim()),
    )
    .slice(0, 7);

  function open() {
    setQuery('');
    setSelected(0);
    dialog.current?.showModal();
    input.current?.focus();
  }
  useEffect(() => {
    function shortcut(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else {
          setQuery('');
          setSelected(0);
          dialog.current?.showModal();
          input.current?.focus();
        }
      }
    }
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);

  useEffect(() => {
    if (dialog.current?.open)
      dialog.current
        .querySelector(`#jump-result-${selected}`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  function navigate(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length)
        setSelected(
          (index) =>
            (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) %
            results.length,
        );
    }
    if (event.key === 'Enter' && results[selected]) {
      event.preventDefault();
      dialog.current?.close();
      router.push(results[selected].href);
    }
  }

  return (
    <>
      <button
        type="button"
        className="quick-jump-trigger"
        onClick={open}
        aria-label="Quick jump. Control or Command K."
      >
        <Search size={18} aria-hidden="true" />
        <kbd>K</kbd>
      </button>
      <dialog
        ref={dialog}
        className="quick-jump-dialog"
        aria-labelledby="quick-jump-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="quick-jump-top">
          <h2 id="quick-jump-title">Find a project.</h2>
          <button
            type="button"
            aria-label="Close quick jump"
            onClick={() => dialog.current?.close()}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <label className="quick-jump-input">
          <Search size={20} aria-hidden="true" />
          <span className="visually-hidden">Search destinations</span>
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="jump-results"
            aria-activedescendant={
              results.length ? `jump-result-${selected}` : undefined
            }
            aria-autocomplete="list"
            placeholder="Search projects, teaching, or writing…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            onKeyDown={navigate}
          />
        </label>
        <div
          className="jump-results"
          id="jump-results"
          role="listbox"
          aria-label="Destinations"
        >
          {results.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              role="option"
              aria-selected={index === selected}
              id={`jump-result-${index}`}
              onMouseMove={() => setSelected(index)}
              onClick={() => dialog.current?.close()}
            >
              <span>{item.name}</span>
              <span className="jump-kind">{item.kind}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
        {!results.length ? (
          <p className="jump-empty" role="status">
            Nothing here yet. Try “Pixio”, “teaching”, or “blog”.
          </p>
        ) : null}
        <p className="jump-help">
          Arrow keys to explore. Enter to jump. Escape to close.
        </p>
      </dialog>
    </>
  );
}
