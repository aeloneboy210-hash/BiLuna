import { describe, expect, it } from 'vitest'
import { CATALOG, extractSources, sourcesTag } from '@/lib/knowledge/catalog'
import { CONTENT } from '@/lib/knowledge/content'
import { findCards, knowledgeBlock } from '@/lib/knowledge/find'
import { unexplainedDoses } from '@/lib/health/dose-guard'

const ALLOWED_HOSTS = /(^|\.)(who\.int|unicef\.org|nhs\.uk|cdc\.gov|dghs\.gov\.bd)$/

const ids = (text: string, earlier: string[] = []) => findCards([...earlier, text]).map((c) => c.id)

describe('guideline cards', () => {
  it('has the 20 agreed topics, each with text, keywords, a title in both languages and a source', () => {
    expect(CATALOG).toHaveLength(20)
    for (const card of CATALOG) {
      const content = CONTENT[card.id]
      expect(content, card.id).toBeDefined()
      expect(content.keywords.length, card.id).toBeGreaterThan(3)
      expect(content.facts.length, card.id).toBeGreaterThan(200)
      expect(card.title.en && card.title.bn, card.id).toBeTruthy()
      expect(card.sources.length, card.id).toBeGreaterThan(0)
    }
    expect(Object.keys(CONTENT).sort()).toEqual(CATALOG.map((c) => c.id).sort())
  })

  it('cites only trusted health sites, over https', () => {
    for (const card of CATALOG) {
      for (const s of card.sources) {
        const url = new URL(s.url)
        expect(url.protocol, s.url).toBe('https:')
        expect(url.hostname, s.url).toMatch(ALLOWED_HOSTS)
      }
    }
  })

  it('never gives a medicine amount', () => {
    for (const card of CATALOG) expect(unexplainedDoses(CONTENT[card.id].facts, ''), card.id).toEqual([])
  })

  it('is marked as not yet checked by a doctor', () => {
    expect(CATALOG.every((c) => c.reviewed === false)).toBe(true)
  })
})

describe('findCards', () => {
  it('finds cards from English messages', () => {
    expect(ids('I have had a fever for 3 days with pain behind my eyes, could it be dengue?')).toEqual(
      expect.arrayContaining(['dengue', 'fever']),
    )
    expect(ids('My stomach burns after meals, bad acidity')).toContain('gastric')
    expect(ids('burning when peeing and I pee often')).toContain('uti')
    expect(ids('It burns when I pee and I need to go all the time')).toContain('uti')
    expect(ids('I get a burning feeling in my chest after eating')).toContain('gastric')
    expect(ids('fever for 3 days with pain behind my eyes')).toEqual(expect.arrayContaining(['dengue', 'fever']))
  })

  it('finds cards from Bangla and Banglish messages', () => {
    expect(ids('দুই দিন ধরে পাতলা পায়খানা হচ্ছে')).toContain('diarrhoea')
    expect(ids('আমি গর্ভবতী, রক্ত যাচ্ছে')).toContain('pregnancy')
    expect(ids('বুক জ্বালা করে আর টক ঢেকুর')).toContain('gastric')
    expect(ids('amar jor hoyeche')).toContain('fever')
    expect(ids('আমার কি ডায়াবেটিস হয়েছে?')).toContain('diabetes')
  })

  it('lets a longer phrase use up its words', () => {
    expect(ids('জন্ডিস হয়েছে, পেটে বাচ্চা আছে')).toEqual(['pregnancy', 'jaundice'])
  })

  it('finds nothing in greetings or unrelated words', () => {
    expect(ids('hi')).toEqual([])
    expect(ids('হ্যালো, কেমন আছো?')).toEqual([])
    expect(ids('This is urgent, my dad wants to know')).toEqual([])
    expect(ids('জরুরি একটা প্রশ্ন')).toEqual([])
  })

  it('does not match short English words inside longer ones', () => {
    expect(ids('I drink lots of fluids and it is getting worse')).toEqual([])
  })

  it('keeps the topic of a follow-up message from the patient’s earlier words', () => {
    expect(ids('it has been 4 days now', ['I think I have dengue'])).toContain('dengue')
  })

  it('returns at most two cards, best match first', () => {
    const found = ids('fever, cough, diarrhoea, headache, back pain and itchy skin')
    expect(found.length).toBeLessThanOrEqual(2)
  })

  it('gives the AI the card text with its title and a reminder that no doses are allowed', () => {
    const block = knowledgeBlock(findCards(['dengue fever']))
    expect(block).toContain('Dengue')
    expect(block).toContain('aspirin')
    expect(block).toMatch(/no dose/i)
    expect(knowledgeBlock([])).toBe('')
  })
})

describe('sources tag', () => {
  it('round-trips known ids and drops unknown or repeated ones', () => {
    expect(extractSources(`Answer\n${sourcesTag(['dengue', 'fever'])}`)).toEqual({ text: 'Answer', ids: ['dengue', 'fever'] })
    expect(extractSources('Hi [[sources: made-up, dengue, dengue]]').ids).toEqual(['dengue'])
    expect(extractSources('plain text')).toEqual({ text: 'plain text', ids: [] })
  })
})
