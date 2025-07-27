/**
 * @file suggestionService.ts
 * @description 提供用于生成文本建议的服务函数。
 */

/**
 * 根据公司名称生成缩写建议
 * 
 * @param companyName 公司全称
 * @returns 缩写建议字符串，如果没有合适的建议则返回 null
 * 
 * @description
 * 该函数遵循以下规则来生成缩写：
 * 1. 移除公司名称中常见的法律实体后缀（如 "Pty Ltd", "Inc." 等）。
 * 2. 将剩余部分按空格分割成单词。
 * 3. 如果有两个或更多单词，则取每个单词的首字母并大写，组成缩写。
 * 4. 如果生成的缩写与清理后的名称相同，或缩写只有一个字母，则认为是不好的建议，返回 null。
 * 5. 作为备用策略，如果首字母缩写太短，它会尝试使用前两个单词的首字母。
 * 
 * @example
 * // returns "BA Pty Ltd"
 * generateAbbreviation("Brenntag Australia Pty Ltd")
 * 
 * @example
 * // returns null
 * generateAbbreviation("Arkema")
 */
export const generateAbbreviation = (companyName: string): string | null => {
  if (!companyName || companyName.trim().length === 0) {
    return null;
  }

  // 常见公司后缀列表
  const suffixes = [
    'Pty Ltd', 'Ltd', 'Inc', 'Corp', 'LLC', 
    'Limited', 'Corporation', 'Incorporated', 
    'Company', 'Co.', 'GmbH', 'AG', 'S.A.', 'S.L.', 'B.V.'
  ];

  let nameToProcess = companyName;
  
  // 移除后缀
  for (const suffix of suffixes) {
    const regex = new RegExp(`\\s*,?\\s*${suffix}\\.?$`, 'i');
    if (regex.test(nameToProcess)) {
      nameToProcess = nameToProcess.replace(regex, '');
      break; 
    }
  }

  // 移除所有非字母和空格的字符，然后按空格分割
  const words = nameToProcess
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .split(/\s+/);

  if (words.length > 1) {
    // 取每个单词的首字母并大写
    const abbreviation = words.map(word => word.charAt(0).toUpperCase()).join('');
    
    // 如果缩写太短（例如只有一个字母），或者等于清理后的单词本身，则可能不是一个好的建议
    if (abbreviation.length <= 1 && words.length > 1) {
      // 尝试使用前两个单词
      const longerAbbreviation = words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
      if (longerAbbreviation.length > 1 && longerAbbreviation.toLowerCase() !== nameToProcess.toLowerCase()) {
        return longerAbbreviation;
      }
      return null;
    }

    if (abbreviation.toLowerCase() !== nameToProcess.toLowerCase()) {
      return abbreviation;
    }
  }

  return null;
}; 