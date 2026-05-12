package seed

import (
	"math"
	"testing"
)

func TestPickN_Basic(t *testing.T) {
	rng := newSeededRand()
	items := []int{1, 2, 3, 4, 5}

	result := pickN(rng, items, 3)
	if len(result) != 3 {
		t.Fatalf("expected 3 items, got %d", len(result))
	}
	seen := map[int]bool{}
	for _, v := range result {
		if seen[v] {
			t.Fatal("duplicate found")
		}
		seen[v] = true
	}
}

func TestPickN_ExceedsLen(t *testing.T) {
	rng := newSeededRand()
	items := []int{1, 2}
	result := pickN(rng, items, 10)
	if len(result) != 2 {
		t.Fatalf("expected 2, got %d", len(result))
	}
}

func TestPickN_Zero(t *testing.T) {
	rng := newSeededRand()
	result := pickN(rng, []int{1, 2, 3}, 0)
	if result != nil {
		t.Fatal("expected nil")
	}
}

func TestWeightedPick_Distribution(t *testing.T) {
	rng := newSeededRand()
	weights := []float64{0.30, 0.40, 0.20, 0.10}
	counts := make([]int, 4)
	n := 10000
	for i := 0; i < n; i++ {
		counts[weightedPick(rng, weights)]++
	}
	for i, w := range weights {
		expected := w * float64(n)
		diff := math.Abs(float64(counts[i]) - expected)
		if diff/expected > 0.08 {
			t.Errorf("bucket %d: expected ~%.0f, got %d (diff %.1f%%)", i, expected, counts[i], diff/expected*100)
		}
	}
}

func TestCalcProgress_FullyCompleted(t *testing.T) {
	p := calcProgress(5, 5, 2, 2, 2, 2)
	if p != 100 {
		t.Fatalf("expected 100, got %d", p)
	}
}

func TestCalcProgress_ZeroModules(t *testing.T) {
	p := calcProgress(0, 0, 1, 2, 1, 2)
	// 0 modules → ratio=1.0 → 50 + 12.5 + 12.5 = 75
	if p != 75 {
		t.Fatalf("expected 75, got %d", p)
	}
}

func TestCalcProgress_Cap100(t *testing.T) {
	// Shouldn't exceed 100 even with weird inputs
	p := calcProgress(10, 5, 5, 2, 5, 2)
	if p > 100 {
		t.Fatalf("expected <=100, got %d", p)
	}
}

func TestSlugify(t *testing.T) {
	tests := []struct {
		base string
		idx  int
		want string
	}{
		{"Hello World", 0, "hello-world"},
		{"Golang & Next.js", 1, "golang-next-js-1"},
		{"  Spasi  Banyak  ", 2, "spasi-banyak-2"},
	}
	for _, tt := range tests {
		got := slugify(tt.base, tt.idx)
		if got != tt.want {
			t.Errorf("slugify(%q, %d) = %q, want %q", tt.base, tt.idx, got, tt.want)
		}
	}
}
