// Package ai defines the seam for future AI-powered categorization and
// insight generation. Nothing here calls a model: it only fixes the
// interfaces the rest of the app codes against, so a provider can be dropped
// in later without touching services. Implementations must never be imported
// directly by handlers.
package ai

import "context"

// Categorizer suggests a category for a transaction description. A nil or
// zero-value suggestion means "no recommendation".
type Categorizer interface {
	SuggestCategory(ctx context.Context, description string) (categoryName string, err error)
}

// InsightsGenerator turns aggregated summary data into a short natural
// language insight. Input is opaque JSON produced by the summary/insights
// services.
type InsightsGenerator interface {
	GenerateInsight(ctx context.Context, summaryJSON []byte) (insight string, err error)
}

// NoopCategorizer is the default until a provider is configured.
type NoopCategorizer struct{}

func (NoopCategorizer) SuggestCategory(context.Context, string) (string, error) {
	return "", nil
}

// NoopInsightsGenerator is the default until a provider is configured.
type NoopInsightsGenerator struct{}

func (NoopInsightsGenerator) GenerateInsight(context.Context, []byte) (string, error) {
	return "", nil
}
