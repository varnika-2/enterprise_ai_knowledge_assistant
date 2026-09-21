import math,re
from collections import Counter
def recall(r,rel,k=5):return len(set(r[:k])&set(rel))/max(1,len(set(rel)))
def precision(r,rel,k=5):return len(set(r[:k])&set(rel))/max(1,k)
def mrr(r,rel):
 for i,x in enumerate(r,1):
  if x in set(rel):return 1/i
 return 0
def ndcg(r,rel,k=5):
 s=set(rel);dcg=sum((1 if x in s else 0)/math.log2(i+2) for i,x in enumerate(r[:k]));ideal=sum(1/math.log2(i+2) for i in range(min(k,len(s))));return dcg/ideal if ideal else 0
def similarity(a,b):
 A=Counter(re.findall(r'\w+',a.lower()));B=Counter(re.findall(r'\w+',b.lower()));dot=sum(A[x]*B[x] for x in A);na=sum(v*v for v in A.values())**.5;nb=sum(v*v for v in B.values())**.5;return dot/(na*nb) if na and nb else 0
