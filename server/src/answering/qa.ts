import log from '../lib/log'
import { argMax, round, softMax } from '../lib/math'
import { runInference } from './inference'
import { createTokenizer } from './tokenizer'

const tokenizer = createTokenizer()

const clean = (answer: string) => {
  const [firstLetter, ...rest] = answer.trim()

  if (!firstLetter) return ''

  return `${firstLetter.toUpperCase()}${rest.join('')}`
}

const isShort = (answer: string, maxLength = 48) => answer.split(' ').length < maxLength

const getAnswer = async (question: string, context: string) => {
  const answers: {
    answer: string
    score: number
  }[] = []

  const encoded = await tokenizer.encode(question, context)
  const inputs = [encoded, ...encoded.overflowing]

  for (const input of inputs) {
    const { ansStart, ansEnd } = await runInference(input.ids, input.attentionMask)
    const startProbs = softMax(ansStart)
    const endProbs = softMax(ansEnd)

    const startIdx = argMax(ansStart)
    const endIdx = argMax(ansEnd)

    const score = (startProbs[startIdx] ?? 0) * (endProbs[endIdx] ?? 0)
    const answer = await tokenizer.decode(input.ids, startIdx, endIdx + 1)

    isShort(answer) ? answers.push({ answer, score }) : answers.push({ answer: '', score: 0 })
  }

  log.info(answers)

  const top1 = answers
    .sort((a, b) => {
      if (!a.answer) return 1
      if (!b.answer) return -1

      return b.score - a.score
    })
    .shift()

  return {
    answer: clean(top1?.answer ?? ''),
    score: round(top1?.score ?? 100)
  }
}

export { getAnswer }
