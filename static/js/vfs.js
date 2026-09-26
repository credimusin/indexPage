/**
 * imaginalOS - Virtual File System (VFS) Module
 */
(function() {
    const defaultVFS = {
        'type': 'dir',
        'children': {
            'home': {
                'type': 'dir',
                'children': {
                    'bmo': {
                        'type': 'dir',
                        'children': {
                            'about.txt': {
                                'type': 'file',
                                'readonly': true,
                                'contentPath': 'static/vfs/about.txt'
                            },
                            'contact.txt': {
                                'type': 'file',
                                'readonly': true,
                                'contentPath': 'static/vfs/contact.txt'
                            },
                            'dossier.txt': {
                                'type': 'file',
                                'readonly': true,
                                'contentPath': 'static/vfs/dossier.txt'
                            },
                            'draft_rates.cfg': {
                                'type': 'file',
                                'readonly': true,
                                'contentPath': 'static/vfs/draft_rates.cfg'
                            },
                            'projects': {
                                'type': 'dir',
                                'readonly': true,
                                'children': {
                                    'imaginal.txt': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/projects/imaginal.txt'
                                    },
                                    'cashflow_360.txt': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/projects/cashflow_360.txt'
                                    },
                                    'drills.txt': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/projects/drills.txt'
                                    },
                                    'inner_light.txt': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/projects/inner_light.txt'
                                    }
                                }
                            },
                            'fun': {
                                'type': 'dir',
                                'readonly': true,
                                'children': {
                                    'jokes.txt': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/fun/jokes.txt'
                                    },
                                    'cyber_bmo_cat.jpg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'content': 'IMAGE:static/images/fun/cyber_bmo_cat.jpg'
                                    },
                                    'lazy_keyboard_cat.jpg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'content': 'IMAGE:static/images/fun/lazy_keyboard_cat.jpg'
                                    },
                                    'space_cat.jpg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'content': 'IMAGE:static/images/fun/space_cat.jpg'
                                    },
                                    'programmer_cat.jpg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'content': 'IMAGE:static/images/fun/programmer_cat.jpg'
                                    },
                                    'works_on_my_machine.jpg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'content': 'IMAGE:static/images/fun/works_on_my_machine.jpg'
                                    },
                                    'bug_feature.jpg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'content': 'IMAGE:static/images/fun/bug_feature.jpg'
                                    },
                                    'code_coffee.jpg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'content': 'IMAGE:static/images/fun/code_coffee.jpg'
                                    },
                                    'git_force.jpg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'content': 'IMAGE:static/images/fun/git_force.jpg'
                                    }
                                }
                            },
                            'feedback': {
                                'type': 'dir',
                                'children': {
                                    'review_by_guest.txt': {
                                        'type': 'file',
                                        'contentPath': 'static/vfs/feedback/review_by_guest.txt'
                                    },
                                    'xss_test.txt': {
                                        'type': 'file',
                                        'contentPath': 'static/vfs/feedback/xss_test.txt'
                                    }
                                }
                            },
                            'secrets': {
                                'type': 'dir',
                                'readonly': true,
                                'children': {
                                    'glitch.cfg': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/secrets/glitch.cfg'
                                    },
                                    'passwords.db': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/secrets/passwords.db'
                                    },
                                    'public.key': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/secrets/public.key'
                                    },
                                    'soul.bin': {
                                        'type': 'file',
                                        'readonly': true,
                                        'contentPath': 'static/vfs/secrets/soul.bin'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    function isDir(node) {
        return !!node && node.type === 'dir';
    }

    function hasChildren(node) {
        return isDir(node) && !!node.children;
    }

    async function loadNodeContent(node) {
        if (!node || node.content !== undefined || !node.contentPath) return node ? node.content : undefined;

        try {
            const response = await fetch(node.contentPath);
            if (!response.ok) {
                node.content = `[Error: Failed to load ${node.contentPath}]`;
                return node.content;
            }
            node.content = await response.text();
        } catch {
            node.content = `[Error: Network error loading ${node.contentPath}]`;
            return node.content;
        }

        saveVFS(window.imaginalOS.filesystem);
        return node.content;
    }

    function mergeDefaults(node, defaults) {
        if (!defaults || !hasChildren(defaults)) return false;

        let changed = false;
        if (!hasChildren(node)) {
            node.children = {};
            changed = true;
        }
        for (const [key, defaultChild] of Object.entries(defaults.children)) {
            if (node.children[key] === undefined) {
                node.children[key] = structuredClone(defaultChild);
                changed = true;
            } else if (mergeDefaults(node.children[key], defaultChild)) {
                changed = true;
            }
        }
        return changed;
    }

    function loadVFS() {
        try {
            const savedVersion = localStorage.getItem('imaginal_vfs_version');
            const saved = localStorage.getItem('imaginal_vfs');
            if (saved && savedVersion === String(window.imaginalOS.VERSION)) {
                const parsed = JSON.parse(saved);
                if (mergeDefaults(parsed, defaultVFS)) {
                    saveVFS(parsed);
                }
                return parsed;
            }
        } catch {}
        const copy = structuredClone(defaultVFS);
        saveVFS(copy);
        return copy;
    }

    function saveVFS(vfsData) {
        try {
            localStorage.setItem('imaginal_vfs', JSON.stringify(vfsData));
            localStorage.setItem('imaginal_vfs_version', String(window.imaginalOS.VERSION));
        } catch {}
    }

    function resolvePath(pathStr) {
        const segments = pathStr.split('/');
        let workingPath = [...window.imaginalOS.currentPath];

        if (pathStr.startsWith('/')) {
            workingPath = [];
        }

        for (const seg of segments) {
            if (seg === '' || seg === '.') {
                continue;
            }
            if (seg === '..') {
                if (workingPath.length > 0) {
                    workingPath.pop();
                }
            } else {
                workingPath.push(seg);
            }
        }

        let node = window.imaginalOS.filesystem;
        for (const seg of workingPath) {
            if (hasChildren(node) && node.children[seg]) {
                node = node.children[seg];
            } else {
                return { error: 'No such file or directory', path: workingPath };
            }
        }
        return { node, path: workingPath };
    }

    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.defaultVFS = defaultVFS;
    window.imaginalOS.isDir = isDir;
    window.imaginalOS.hasChildren = hasChildren;
    window.imaginalOS.loadNodeContent = loadNodeContent;
    window.imaginalOS.filesystem = loadVFS();
    window.imaginalOS.currentPath = ['home', 'bmo'];
    window.imaginalOS.saveVFS = saveVFS;
    window.imaginalOS.resolvePath = resolvePath;
})();
