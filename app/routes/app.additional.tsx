export default function AdditionalPage() {
  return (
    <s-page heading="Basic Wishlist">
      <s-section heading="Total">
        <s-grid
          gridTemplateColumns="repeat(2, 1fr)"
          gap="small"
          justifyContent="center"
        >
          <s-grid-item gridColumn="span 1" padding="large">
            <s-paragraph>
              <s-text>0 </s-text>
              <s-text>products</s-text>
            </s-paragraph>
          </s-grid-item>
          <s-grid-item gridColumn="auto" padding="large">
            <s-text>0 </s-text>
            <s-text>customers</s-text>
          </s-grid-item>
        </s-grid>
      </s-section>
      <s-section heading="Top products">
        <s-table>
          <s-table-header-row>
            <s-table-header>Product</s-table-header>
            <s-table-header>Vendor</s-table-header>
            <s-table-header>Type</s-table-header>
            <s-table-header format="numeric">Count</s-table-header>
          </s-table-header-row>
          <s-table-body>
            <s-table-row>
              <s-table-cell>The Collection Snowbo</s-table-cell>
              <s-table-cell>Hydrogen Vendor</s-table-cell>
              <s-table-cell>snowboard</s-table-cell>
              <s-table-cell>1</s-table-cell>
            </s-table-row>
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
