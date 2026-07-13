package seed

import (
	"fmt"
	"math"
	mrand "math/rand"
	"regexp"
	"strings"
)

func newSeededRand() *mrand.Rand {
	return mrand.New(mrand.NewSource(42))
}

func pickN[T any](rng *mrand.Rand, items []T, n int) []T {
	if n <= 0 || len(items) == 0 {
		return nil
	}
	if n >= len(items) {
		n = len(items)
	}
	cp := make([]T, len(items))
	copy(cp, items)
	for i := len(cp) - 1; i > 0; i-- {
		j := rng.Intn(i + 1)
		cp[i], cp[j] = cp[j], cp[i]
	}
	return cp[:n]
}

func weightedPick(rng *mrand.Rand, weights []float64) int {
	total := 0.0
	for _, w := range weights {
		total += w
	}
	r := rng.Float64() * total
	cum := 0.0
	for i, w := range weights {
		cum += w
		if r <= cum {
			return i
		}
	}
	return len(weights) - 1
}

func calcProgress(completedMods, totalMods, passedQuizzes, totalQuizzes, gradedAssignments, totalAssignments int) int {
	modRatio := 1.0
	if totalMods > 0 {
		modRatio = float64(completedMods) / float64(totalMods)
	}
	quizRatio := 1.0
	if totalQuizzes > 0 {
		quizRatio = float64(passedQuizzes) / float64(totalQuizzes)
	}
	assignRatio := 1.0
	if totalAssignments > 0 {
		assignRatio = float64(gradedAssignments) / float64(totalAssignments)
	}
	progress := modRatio*50 + quizRatio*25 + assignRatio*25
	p := int(math.Round(progress))
	if p > 100 {
		p = 100
	}
	return p
}

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(base string, idx int) string {
	s := strings.ToLower(base)
	s = slugRe.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if idx > 0 {
		s = fmt.Sprintf("%s-%d", s, idx)
	}
	return s
}

func randomInRange(rng *mrand.Rand, min, max int) int {
	if min >= max {
		return min
	}
	return min + rng.Intn(max-min+1)
}
