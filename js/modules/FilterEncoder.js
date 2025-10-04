import { 
    ruleManager
} from '../globals.js';
export class FilterEncoder {
    constructor(ruleManager) {
        this.defaultRule =  ruleManager.ruleTemplate;
        this.codeStartIndex = 9 * 64 + 10; // Start at '9A'
        this.currentCodeIndex = this.codeStartIndex;
        this.initDictionaries();
        this.initItemCodeDictionary();
    }

    initDictionaries() {
        // Initialize instance dictionaries
        this.DICTIONARIES = {
            boolean: {
                '1A': true,
                '1B': false
            },
            itemQuality: FilterEncoder.DICTIONARIES.itemQuality,
            ethereal: FilterEncoder.DICTIONARIES.ethereal,
            ruleType: FilterEncoder.DICTIONARIES.ruleType,
            classType: FilterEncoder.DICTIONARIES.classType,
            itemCodes: {} // Will be populated when needed
        };
        
        this.REVERSE_DICTS = {
            boolean: {
                true: '1A',
                false: '1B'
            },
            itemQuality: FilterEncoder.REVERSE_DICTS.itemQuality,
            ethereal: FilterEncoder.REVERSE_DICTS.ethereal,
            ruleType: FilterEncoder.REVERSE_DICTS.ruleType,
            classType: FilterEncoder.REVERSE_DICTS.classType,
            itemCodes: {} // Will be populated when needed
        };
    }

    // Predefined dictionaries for each parameter
    static DICTIONARIES = {
        itemQuality: {
            '2A': -1, '2B': 1, '2C': 2, '2D': 3, '2E': 4, 
            '2F': 5, '2G': 6, '2H': 7, '2I': 8, '2J': 9
        },
        ethereal: {
            '3A': 0, '3B': 1, '3C': 2
        },
        ruleType: {
            '4A': -1, '4B': 0, '4C': 1
        },
        classType: {
            '5A': 1,   // Gold
            '5B': 2,   // Gear
            '5C': 3,   // Armor
            '5D': 4,   // Weapon
            '5E': 5,   // Jewelry
            '5F': 6,   // Quiver
            '5G': 7,   // Class Specific
            '5H': 8,   // Class Specific Amazon
            '5I': 9,   // Class Specific Sorceress
            '5J': 10,  // Class Specific Necromancer
            '5K': 11,  // Class Specific Paladin
            '5L': 12,  // Class Specific Barbarian
            '5M': 13,  // Class Specific Druid
            '5N': 14,  // Class Specific Assassin
            '5O': 15,  // Tier 1
            '5P': 16,  // Tier 2
            '5Q': 17,  // Tier 3
            '5R': 18,  // Tier 4
            '5S': 19,  // Tier Sacred
            '5T': 20,  // Tier Mastercrafted
            '5U': 21,  // Tier Angelic
            '5V': 22,  // Quest Reward
            '5W': 23,  // Potion
            '5X': 24,  // Potion Health
            '5Y': 25,  // Potion Mana
            '5Z': 26,  // Socket Filler
            '6A': 27,  // Jewel
            '6B': 28,  // Rune
            '6C': 29,  // Rune Enchanted
            '6D': 30,  // Rune Great
            '6E': 31,  // Rune Elemental
            '6F': 32,  // Gem
            '6G': 33,  // Gem Perfect
            '6H': 34,  // Gem Imperfect
            '6I': 35,  // Rune Common
            '6J': 36,  // Gem Amethyst
            '6K': 37,  // Gem Topaz
            '6L': 38,  // Gem Sapphire
            '6M': 39,  // Gem Emerald
            '6N': 40,  // Gem Ruby
            '6O': 41,  // Gem Diamond
            '6P': 42,  // Gem Skull
            '6Q': 43,  // Gem Onyx
            '6R': 44,  // Gem Bloodstone
            '6S': 45,  // Gem Turquoise
            '6T': 46,  // Gem Amber
            '6U': 47,  // Gem Rainbow Stone
            '6V': 48,  // Shrine
            '6W': 49,  // Shrine Creepy
            '6X': 50,  // Shrine Abandoned
            '6Y': 51,  // Shrine Quiet
            '6Z': 52,  // Shrine Eerie
            '7A': 53,  // Shrine Weird
            '7B': 54,  // Shrine Tainted
            '7C': 55,  // Shrine Intimidating
            '7D': 56,  // Shrine Trinity
            '7E': 57,  // Shrine Fascinating
            '7F': 58,  // Shrine Ornate
            '7G': 59,  // Shrine Sacred
            '7H': 60,  // Shrine Shimmering
            '7I': 61,  // Shrine Spirit
            '7J': 62,  // Shrine Magical
            '7K': 63,  // Shrine Enchanted
            '7L': 64,  // Shrine Hidden
            '7M': 65,  // Mystic Orb
            '7N': 66,  // Mystic Orb Unique
            '7O': 67,  // Signet
            '7P': 68,  // Signet Gold
            '7Q': 69,  // Signet Attribute
            '7R': 70,  // Arcane Shard
            '7S': 71,  // Arcane Crystal
            '7T': 72,  // Oil
            '7U': 73,  // Color Dye
            '7V': 74,  // Cube Reagent
            '7W': 75,  // Trophy
            '7X': 76,  // Cycle
            '7Y': 77,  // Cycle Small
            '7Z': 78,  // Cycle Medium
            '8A': 79,  // Cycle Large
            '8B': 80,  // Riftstone
            '8C': 81,  // Catalyst
            '8D': 82,  // Design Scheme
            '8E': 83,  // Quest Item
            '8F': 84,  // Relic
            '8G': 85,  // Essence
            '8H': 86,  // Special Crystal
            '8I': 87,  // Emblem
            '8J': 88,  // Scroll
            '8K': 89,  // Effigy
            '8L': 90,  // Special Shard
            '8M': 91,  // Enchant Scroll
            '8N': 92   // Shield
        },
        itemCodes: {}
    };

    // Reverse dictionaries for decoding
    static REVERSE_DICTS = (() => {
        const reversed = {};
        for (const [dictName, dict] of Object.entries(FilterEncoder.DICTIONARIES)) {
            reversed[dictName] = {};
            for (const [code, value] of Object.entries(dict)) {
                reversed[dictName][value] = code;
            }
        }
        return reversed;
    })();

    initItemCodeDictionary() {
        if (Object.keys(this.DICTIONARIES.itemCodes).length === 0) {
            const items = ruleManager.getItemCodes();
            // Reset counter when initializing dictionary
            this.currentCodeIndex = this.codeStartIndex;
            
            Object.entries(items).forEach(([index, value]) => {
                const code = this.generateCodeForValue();
                this.DICTIONARIES.itemCodes[code] = parseInt(value[0]); // Convert key to number
                this.REVERSE_DICTS.itemCodes[parseInt(value[0])] = code;
            });
        }
    }
    
    // Helper for items without hex codes
    generateCodeForValue() {
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        
        // Generate sequential codes starting from '9A'
        const code = base64Chars[Math.floor(this.currentCodeIndex / 64)] + 
                     base64Chars[this.currentCodeIndex % 64];
        
        // Increment for next item (wrap around if needed)
        this.currentCodeIndex++;
        if (this.currentCodeIndex >= 4096) {
            throw new Error('Code generation limit exceeded.');
        }
        
        return code;
    }

    // Main Compression/Decompression
    compressFilter(filter) {
        try {
            // More permissive validation
            if (!filter || typeof filter !== 'object') {
                console.error("Invalid filter: not an object");
                return null;
            }
            
            // Check for required properties
            if (filter.default_show_items === undefined || 
                filter.name === undefined ||
                !Array.isArray(filter.rules)) {
                console.error("Invalid filter structure");
                return null;
            }

            // Validate filter size limits
            const filterString = JSON.stringify(filter);
            if (filterString.length > 1000000) { // 1MB limit
                console.error("Filter data too large for compression");
                return null;
            }

            // Validate rules array size
            if (filter.rules.length > 1000) {
                console.error("Too many rules in filter");
                return null;
            }
            
            // Process the filter
            const safeFilter = {
                default_show_items: Boolean(filter.default_show_items),
                name: String(filter.name),
                rules: Array.isArray(filter.rules) ? filter.rules : []
            };
            
            // Encode header
            const header = [
                safeFilter.default_show_items ? '1A' : '1B',
                this.encodeString(safeFilter.name, 50)
            ].join('');
            
            // Encode rules (handle empty array case)
            const rules = safeFilter.rules.map(rule => {
                const safeRule = {
                    active: Boolean(rule?.active ?? true),
                    automap: Boolean(rule?.automap ?? true),
                    ethereal: Number(rule?.ethereal ?? 0),
                    item_quality: Number(rule?.item_quality ?? -1),
                    max_clvl: Math.max(0, Math.min(Number(rule?.max_clvl ?? 0), 99)),
                    max_ilvl: Math.max(0, Math.min(Number(rule?.max_ilvl ?? 0), 99)),
                    min_clvl: Math.max(0, Math.min(Number(rule?.min_clvl ?? 0), 99)),
                    min_ilvl: Math.max(0, Math.min(Number(rule?.min_ilvl ?? 0), 99)),
                    notify: Boolean(rule?.notify ?? true),
                    params: rule?.params ?? null,
                    rule_type: Number(rule?.rule_type ?? -1),
                    show_item: Boolean(rule?.show_item ?? true)
                };
                const encoded = this.encodeRule(safeRule);
                return encoded === '' ? 'DEFAULT' : encoded;
            }).join('|');
            
            return `${header}|${rules}`;
        } catch (error) {
            console.error("Compression failed:", error);
            return null;
        }
    }

    decompressFilter(compressed) {
        if (!compressed || typeof compressed !== 'string') {
            console.error("Invalid compressed data");
            return null;
        }

        // Validate compressed data size
        if (compressed.length > 1000000) { // 1MB limit for compressed data
            console.error("Compressed data too large");
            return null;
        }
        
        try {
            const parts = compressed.split('|');
            if (parts.length < 2) {
                console.error("Invalid compressed format");
                return null;
            }

            const [header, ...ruleParts] = parts;
            
            // Validate header format
            if (!header || header.length < 2) {
                console.error("Invalid header format");
                return null;
            }

            const booleanCode = header.substring(0, 2);
            if (!this.DICTIONARIES.boolean[booleanCode]) {
                console.error("Invalid boolean code in header");
                return null;
            }

            // Validate rule parts count
            if (ruleParts.length > 1000) {
                console.error("Too many rule parts");
                return null;
            }

            return {
                default_show_items: this.DICTIONARIES.boolean[booleanCode],
                name: this.decodeString(header.substring(2)),
                rules: ruleParts.map(part => {
                    if (part === 'DEFAULT') {
                        return {...ruleManager.ruleTemplate}; // Return fresh default rule
                    }
                    return this.decodeRule(part);
                })
            };
        } catch (error) {
            console.error("Decompression failed:", error);
            return null;
        }
    }

    // Rule Encoding/Decoding
    encodeRule(rule) {
        const defaults = ruleManager.ruleTemplate;
        const encodedParts = [];
        
        // Field markers and encodings
        if (rule.active !== defaults.active) {
            encodedParts.push(`a${this.REVERSE_DICTS.boolean[rule.active]}`);
        }
        if (rule.automap !== defaults.automap) {
            encodedParts.push(`m${this.REVERSE_DICTS.boolean[rule.automap]}`);
        }
        if (rule.ethereal !== defaults.ethereal) {
            encodedParts.push(`e${this.REVERSE_DICTS.ethereal[rule.ethereal]}`);
        }
        if (rule.item_quality !== defaults.item_quality) {
            encodedParts.push(`q${this.REVERSE_DICTS.itemQuality[rule.item_quality]}`);
        }
        if (rule.max_clvl !== defaults.max_clvl) {
            encodedParts.push(`x${this.encodeNumber(rule.max_clvl)}`);
        }
        if (rule.max_ilvl !== defaults.max_ilvl) {
            encodedParts.push(`j${this.encodeNumber(rule.max_ilvl)}`);
        }
        if (rule.min_clvl !== defaults.min_clvl) {
            encodedParts.push(`n${this.encodeNumber(rule.min_clvl)}`);
        }
        if (rule.min_ilvl !== defaults.min_ilvl) {
            encodedParts.push(`i${this.encodeNumber(rule.min_ilvl)}`);
        }
        if (rule.notify !== defaults.notify) {
            encodedParts.push(`o${this.REVERSE_DICTS.boolean[rule.notify]}`);
        }
        if (JSON.stringify(rule.params) !== JSON.stringify(defaults.params)) {
            const encodedParams = this.encodeParams(rule.params);
            if (encodedParams !== '0000') {
                encodedParts.push(`p${encodedParams}`);
            }
        }
        if (rule.rule_type !== defaults.rule_type) {
            encodedParts.push(`t${this.REVERSE_DICTS.ruleType[rule.rule_type]}`);
        }
        if (rule.show_item !== defaults.show_item) {
            encodedParts.push(`s${this.REVERSE_DICTS.boolean[rule.show_item]}`);
        }

        // Return empty string for default rules instead of empty array
        return encodedParts.length === 0 ? '' : encodedParts.join(',');
    }
    
    decodeRule(encoded) {
        // Start with default rule template
        const rule = { ...ruleManager.ruleTemplate };
        
        // If empty string, return default rule as-is
        if (!encoded || encoded === '') return rule;
        
        // Split and process each encoded part
        encoded.split(',').forEach(part => {
            if (!part) return;
            
            const fieldCode = part[0];
            const valueCode = part.substring(1);
            try {
                switch(fieldCode) {
                    case 'a': // active
                        rule.active = this.DICTIONARIES.boolean[valueCode];
                        break;
                    case 's': // show_item
                        rule.show_item = this.DICTIONARIES.boolean[valueCode];
                        break;
                    case 'e': // ethereal
                        rule.ethereal = this.DICTIONARIES.ethereal[valueCode];
                        break;
                    case 'q': // item_quality
                        rule.item_quality = this.DICTIONARIES.itemQuality[valueCode];
                        break;
                    case 't': // rule_type
                        rule.rule_type = this.DICTIONARIES.ruleType[valueCode];
                        break;
                    case 'p': // params
                        rule.params = this.decodeParams(valueCode);
                        break;
                    case 'n': // min_clvl
                        rule.min_clvl = this.decodeNumber(valueCode);
                        break;
                    case 'x': // max_clvl
                        rule.max_clvl = this.decodeNumber(valueCode);
                        break;
                    case 'i': // min_ilvl
                        rule.min_ilvl = this.decodeNumber(valueCode);
                        break;
                    case 'j': // max_ilvl
                        rule.max_ilvl = this.decodeNumber(valueCode);
                        break;
                    case 'o': // notify
                        rule.notify = this.DICTIONARIES.boolean[valueCode];
                        break;
                    case 'm': // automap
                        rule.automap = this.DICTIONARIES.boolean[valueCode];
                        break;
                    default:
                        console.warn('Unknown field code:', fieldCode);
                        rule.unknownFields = rule.unknownFields || [];
                        rule.unknownFields.push({ fieldCode, valueCode });
                        break;
                }
            } catch (e) {
                console.warn('Error decoding field:', fieldCode, e);
            }
        });
        
        return rule;
    }

    // Parameter Encoding
    encodeParams(params) {
        if (!params) return '0000';
        
        this.initItemCodeDictionary();
        
        let classCode = '00';
        let itemCode = '00';
        
        if (params.class) {
            classCode = this.REVERSE_DICTS.classType[params.class] || '00';
        }
        
        if (params.code !== undefined) {
            // Find the code we generated for this item value
            itemCode = this.REVERSE_DICTS.itemCodes[params.code];
            if (!itemCode) {
                console.error('No code found for item value:', params.code);
                itemCode = '00';
            }
        }
        
        return classCode + itemCode;
    }
    
    decodeParams(encoded) {
        if (!encoded || encoded === '0000') return null;
        
        const classCode = encoded.substring(0, 2);
        const itemCode = encoded.substring(2, 4);
        
        // For class rules (rule_type = 0), only decode class
        if (classCode !== '00') {
            const classValue = this.DICTIONARIES.classType[classCode];
            if (classValue !== undefined) {
                return { class: classValue };
            }
        }
        
        // For item rules (rule_type = 1), only decode item
        if (itemCode !== '00') {
            this.initItemCodeDictionary();
            const itemValue = this.DICTIONARIES.itemCodes[itemCode];
            if (itemValue !== undefined) {
                return { code: itemValue };
            }
            
            // Fallback - decode as number if not in dictionary
            const num = this.decodeNumber(itemCode);
            if (num !== -65) { // Filter out the -65 error value
                return { code: num };
            }
        }
        
        return null;
    }

    // String Encoding (for names)
    encodeString(str, maxLength) {
        const trimmed = str.slice(0, maxLength);
        const encoder = new TextEncoder();
        const encoded = encoder.encode(trimmed);
        return btoa(String.fromCharCode(...encoded))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    decodeString(encoded) {
        try {
            const decoded = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
            const decoder = new TextDecoder();
            return decoder.decode(Uint8Array.from(decoded, c => c.charCodeAt(0)));
        } catch {
            return '';
        }
    }

    // Number Encoding (0-99)
    encodeNumber(num) {
        num = Number(num);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        return chars[Math.floor(num / 64)] + chars[num % 64];
    }
    
    decodeNumber(encoded) {
        if (!encoded || encoded.length !== 2) return 0;
    
        // First try to look up in item codes dictionary
        if (this.REVERSE_DICTS.itemCodes && this.REVERSE_DICTS.itemCodes[encoded] !== undefined) {
            return this.REVERSE_DICTS.itemCodes[encoded];
        }
        
        // Fall back to base64 position calculation
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const firstIndex = base64Chars.indexOf(encoded[0]);
        const secondIndex = base64Chars.indexOf(encoded[1]);
        
        // Return 0 for invalid codes instead of -65
        if (firstIndex === -1 || secondIndex === -1) return 0;
        
        return (firstIndex * 64) + secondIndex;
    }

    generateShortenedLink(filterData) {
        try {
            const compressed = this.compressFilter(filterData);
            if (!compressed) {
                throw new Error('Compression failed');
            }

            const lzCompressed = LZString.compressToEncodedURIComponent(compressed);
            if (!lzCompressed) {
                throw new Error('LZ compression failed');
            }

            const url = new URL(window.location.href);
            url.search = '';
            
            url.searchParams.set('filter', lzCompressed);
            
            return url.toString();
        } catch (error) {
            console.error('Error generating shortened link:', error);
            return null;
        }
    }

    loadFromShortenedLink(compressedFilter) {
        if (!compressedFilter) return null;
        
        try {
            const decompressed = LZString.decompressFromEncodedURIComponent(compressedFilter);
            if (!decompressed) return null;

            const filterData = this.decompressFilter(decompressed);
            if (!filterData) return null;
            
            // Clear filter parameter using URL API
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('filter');
            window.history.replaceState(null, '', currentUrl);
            
            return filterData;
        } catch (error) {
            console.error('Error loading from shortened link:', error);
            return null;
        }
    }
}