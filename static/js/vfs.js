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

    const VFS_VERSION = window.imaginalOS.VERSION || '0.9.1';

    function loadVFS() {
        try {
            const savedVersion = localStorage.getItem('imaginal_vfs_version');
            if (savedVersion === String(VFS_VERSION)) {
                const saved = localStorage.getItem('imaginal_vfs');
                if (saved) {
                    return JSON.parse(saved);
                }
            }
        } catch {}
        const copy = structuredClone(defaultVFS);
        saveVFS(copy);
        return copy;
    }

    function saveVFS(vfsData) {
        try {
            localStorage.setItem('imaginal_vfs', JSON.stringify(vfsData));
            localStorage.setItem('imaginal_vfs_version', String(VFS_VERSION));
        } catch {}
    }

    function resolvePath(pathStr) {
        let segments = pathStr.split('/');
        let workingPath = [...window.imaginalOS.currentPath];

        if (pathStr.startsWith('/')) {
            workingPath = [];
        }

        for (let seg of segments) {
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
        for (let seg of workingPath) {
            if (node.type === 'dir' && node.children && node.children[seg]) {
                node = node.children[seg];
            } else {
                return { error: 'No such file or directory', path: workingPath };
            }
        }
        return { node, path: workingPath };
    }

    // Expose on global namespace
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.filesystem = loadVFS();
    window.imaginalOS.currentPath = ['home', 'bmo'];
    window.imaginalOS.saveVFS = saveVFS;
    window.imaginalOS.resolvePath = resolvePath;
})();
