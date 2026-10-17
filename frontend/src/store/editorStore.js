import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
//All editor state — the sections array, selected section, save status — lives in one Zustand store. Every component reads and writes this store directly:
//Zustand (qui veut dire "état" en allemand) est une bibliothèque pour gérer
//les données partagées dans une application React.
//a reducer is a function that takes the current state and an action, and returns a new state.

const useEditorStore = create((set, get) => ({
  sections:        [],
  selectedId:      null,
  saveStatus:      'saved',  // 'saved' | 'saving' | 'unsaved'

  setSections: (sections) => set({ sections }), 

  addSection: (type) => {
    const newSection = {
      id:    uuidv4(),
      type,
      props: defaultProps[type] || {}
    };
    set(state => ({ sections: [...state.sections, newSection] }));
  },

  updateSection: (id, props) => set(state => ({
    sections: state.sections.map(s =>
      s.id === id ? { ...s, props: { ...s.props, ...props } } : s
    ), 
    saveStatus: 'unsaved'
  })),

  removeSection: (id) => set(state => ({
    sections: state.sections.filter(s => s.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
    saveStatus: 'unsaved'
  })),

  reorderSections: (newOrder) => set({ sections: newOrder, saveStatus: 'unsaved' }),

  setSelected: (id) => set({ selectedId: id }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}));

const defaultProps = {
  hero:   { title: 'Your heading', subtitle: 'Your subtitle', bg: '#ffffff', btnText: 'Get started' },
  text:   { content: 'Add your text here...' },
  image:  { url: '', alt: '' },
  navbar: { logo: 'My Site', links: ['Home', 'About', 'Contact'] },
};

export default useEditorStore;
