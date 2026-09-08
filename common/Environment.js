/**
 * Environment.js
 * Environment Manager untuk Text Editor
 * @version 1.0.0
 * @license MIT
 */

import { EventDispatcher } from './core/EventDispatcher.js';
import { Cache } from './core/Cache.js';
import { KeymapManager } from './core/KeymapManager.js';
import { ThemeManager } from './core/ThemeManager.js';
import { LanguageManager } from './core/LanguageManager.js';
import { PluginManager } from './core/PluginManager.js';

class Environment {
  constructor(options = {}) {
    this.__identifier = options.identifier || 'editor';
    this.__name = options.name || 'default';
    this.__debug = options.debug || false;
    this.__isReady = false;

    this.__events = new EventDispatcher();
    this.__cache = new Cache({
      maximumSize: options.cacheSize || 100,
      defaultTimeToLive: options.cacheTTL || 300000,
      debug: this.__debug
    });
    this.__keymapManager = new KeymapManager(options.keymap || {});
    this.__themeManager = new ThemeManager({
      defaultTheme: options.theme || 'dark',
      debug: this.__debug
    });
    this.__languageManager = new LanguageManager({
      defaultLanguage: options.language || 'plaintext',
      debug: this.__debug
    });
    this.__pluginManager = new PluginManager({
      debug: this.__debug
    });

    this.__config = {
      fontSize: options.fontSize || 14,
      lineHeight: options.lineHeight || 1.6,
      tabSize: options.tabSize || 2,
      indentSize: options.indentSize || 2,
      wrapText: options.wrapText || false,
      showLineNumbers: options.showLineNumbers || true,
      showWhitespace: options.showWhitespace || false,
      showIndentGuides: options.showIndentGuides || false,
      autoSave: options.autoSave || false,
      autoSaveInterval: options.autoSaveInterval || 10000,
      minimap: options.minimap || false,
      wordWrap: options.wordWrap || false,
      folding: options.folding || false,
      bracketMatching: options.bracketMatching || true,
      autoCloseBrackets: options.autoCloseBrackets || true,
      autoCloseQuotes: options.autoCloseQuotes || true,
      smoothScroll: options.smoothScroll || false,
      virtualScroll: options.virtualScroll || true,
      maxUndo: options.maxUndo || 100,
      maxRedo: options.maxRedo || 50,
      scrollSpeed: options.scrollSpeed || 1.0,
      viewportMargin: options.viewportMargin || 20
    };

    this.__state = {
      cursor: { row: 0, column: 0 },
      selection: null,
      mode: 'normal',
      isDirty: false,
      isReadOnly: false,
      scrollTop: 0,
      scrollLeft: 0
    };
  }

  on(eventType, listener) {
    this.__events.on(eventType, listener);
    return this;
  }

  off(eventType, listener) {
    this.__events.off(eventType, listener);
    return this;
  }

  emit(eventType, data = {}) {
    this.__events.emit(eventType, data);
  }

  getCached(key) {
    return this.__cache.get(key);
  }

  setCache(key, value, timeToLive = null) {
    this.__cache.set(key, value, timeToLive);
    return this;
  }

  deleteCache(key) {
    this.__cache.delete(key);
    return this;
  }

  clearCache() {
    this.__cache.clear();
    return this;
  }

  getCacheStats() {
    return this.__cache.getStats();
  }

  getKeymap() {
    return this.__keymapManager.getAll();
  }

  setKeymap(keymap) {
    this.__keymapManager.setKeymap(keymap);
    this.emit('keymapChanged', { keymap });
    return this;
  }

  getShortcut(action) {
    return this.__keymapManager.get(action);
  }

  setShortcut(action, shortcut) {
    this.__keymapManager.set(action, shortcut);
    this.emit('shortcutChanged', { action, shortcut });
    return this;
  }

  getTheme() {
    return this.__themeManager.getCurrentTheme();
  }

  setTheme(name, customColors = null) {
    if (customColors) {
      this.__themeManager.registerTheme(name, customColors);
    }
    this.__themeManager.setTheme(name);
    this.emit('themeChanged', {
      name,
      colors: this.__themeManager.getCurrentTheme()
    });
    return this;
  }

  getColor(colorKey) {
    return this.__themeManager.getColor(colorKey);
  }

  getAvailableThemes() {
    return this.__themeManager.getAvailableThemes();
  }

  registerTheme(name, colors) {
    this.__themeManager.registerTheme(name, colors);
    return this;
  }

  getLanguage() {
    return this.__languageManager.getCurrentLanguage();
  }

  setLanguage(name, customRules = null) {
    if (customRules) {
      this.__languageManager.registerLanguage(name, customRules);
    }
    this.__languageManager.setLanguage(name);
    this.emit('languageChanged', {
      name,
      rules: this.__languageManager.getCurrentLanguage()
    });
    return this;
  }

  getAvailableLanguages() {
    return this.__languageManager.getAvailableLanguages();
  }

  registerLanguage(name, rules) {
    this.__languageManager.registerLanguage(name, rules);
    return this;
  }

  registerPlugin(name, plugin) {
    this.__pluginManager.register(name, plugin);
    this.emit('pluginRegistered', { name, plugin });
    return this;
  }

  unregisterPlugin(name) {
    this.__pluginManager.unregister(name);
    this.emit('pluginUnregistered', { name });
    return this;
  }

  getPlugin(name) {
    return this.__pluginManager.get(name);
  }

  getAllPlugins() {
    return this.__pluginManager.getAll();
  }

  getIdentifier() {
    return this.__identifier;
  }

  getName() {
    return this.__name;
  }

  setName(name) {
    this.__name = name;
    return this;
  }

  isReady() {
    return this.__isReady;
  }

  initialize() {
    this.__isReady = true;
    this.emit('initialized', { name: this.__name });
    return this;
  }

  dispose() {
    this.emit('disposed', { name: this.__name });
    this.__events = new EventDispatcher();
    this.__cache.clear();
    this.__pluginManager.destroy();
    this.__isReady = false;
    return this;
  }

  getConfig(key = null) {
    if (key) {
      return this.__config[key];
    }
    return { ...this.__config };
  }

  setConfig(key, value) {
    if (typeof key === 'object') {
      this.__config = { ...this.__config, ...key };
    } else {
      this.__config[key] = value;
    }
    this.emit('configChanged', { key, value });
    return this;
  }

  getState() {
    return {
      cursor: { ...this.__state.cursor },
      selection: this.__state.selection ? { ...this.__state.selection } : null,
      mode: this.__state.mode,
      isDirty: this.__state.isDirty,
      isReadOnly: this.__state.isReadOnly,
      scrollTop: this.__state.scrollTop,
      scrollLeft: this.__state.scrollLeft
    };
  }

  setState(state) {
    this.__state = { ...this.__state, ...state };
    this.emit('stateChanged', { state: this.__state });
    return this;
  }

  updateCursor(row, column) {
    this.__state.cursor = { row, column };
    this.emit('cursorMoved', { row, column });
    return this;
  }

  setSelection(startRow, startColumn, endRow, endColumn) {
    this.__state.selection = {
      start: { row: startRow, column: startColumn },
      end: { row: endRow, column: endColumn }
    };
    this.emit('selectionChanged', { selection: this.__state.selection });
    return this;
  }

  clearSelection() {
    this.__state.selection = null;
    this.emit('selectionCleared');
    return this;
  }

  setMode(mode) {
    this.__state.mode = mode;
    this.emit('modeChanged', { mode });
    return this;
  }

  setDirty(isDirty) {
    this.__state.isDirty = isDirty;
    this.emit('dirtyChanged', { isDirty });
    return this;
  }

  setReadOnly(isReadOnly) {
    this.__state.isReadOnly = isReadOnly;
    this.emit('readOnlyChanged', { isReadOnly });
    return this;
  }

  clone() {
    const clone = new Environment({
      identifier: `${this.__identifier}:clone`,
      name: `${this.__name}:clone`,
      debug: this.__debug,
      ...this.__config
    });
    clone.__state = { ...this.__state };
    clone.__isReady = this.__isReady;
    return clone;
  }

  toJSON() {
    return {
      identifier: this.__identifier,
      name: this.__name,
      isReady: this.__isReady,
      config: this.__config,
      state: this.__state,
      theme: this.__themeManager.getCurrentTheme(),
      language: this.__languageManager.getCurrentLanguage(),
      keymap: this.__keymapManager.getAll(),
      pluginCount: this.__pluginManager.getAll().length,
      cacheStats: this.__cache.getStats()
    };
  }

  fromJSON(json) {
    if (json.name) this.__name = json.name;
    if (json.config) this.__config = { ...this.__config, ...json.config };
    if (json.state) this.__state = { ...this.__state, ...json.state };
    if (json.theme) this.__themeManager.setTheme(json.theme);
    if (json.language) this.__languageManager.setLanguage(json.language);
    if (json.keymap) this.__keymapManager.setKeymap(json.keymap);
    if (json.isReady) this.__isReady = json.isReady;
    return this;
  }
}

export { Environment };
